import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleLesson } from '../src/domain/sample';
import { initialState, Lesson } from '../src/domain/types';
import { GenerationCoordinator, requestStudyPack } from '../src/services/generation';

const pack = sampleLesson.pack!;
const attachment = {
  id: 'file',
  uri: 'file://lesson.pdf',
  name: 'lesson.pdf',
  mimeType: 'application/pdf',
  size: 100,
  hash: 'hash',
};
const lesson: Lesson = {
  ...sampleLesson,
  id: 'imported',
  pack: undefined,
  attachments: [
    attachment,
    { ...attachment, id: 'image', name: 'page.jpg', mimeType: 'image/jpeg' },
  ],
};
const responseBody = {
  status: 'completed',
  output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(pack) }] }],
};

test('saved lessons never call the generator again', async () => {
  const coordinator = new GenerationCoordinator();
  let calls = 0;
  assert.deepEqual(
    await coordinator.generate(sampleLesson, async () => {
      calls++;
      return pack;
    }),
    pack,
  );
  assert.equal(calls, 0);
});
test('simultaneous generation requests share a single API operation', async () => {
  const coordinator = new GenerationCoordinator();
  let calls = 0;
  let resolve!: (value: typeof pack) => void;
  const pending = new Promise<typeof pack>((r) => {
    resolve = r;
  });
  const work = () => {
    calls++;
    return pending;
  };
  const first = coordinator.generate(lesson, work);
  const second = coordinator.generate(lesson, work);
  assert.equal(first, second);
  assert.equal(coordinator.isGenerating(lesson.id), true);
  resolve(pack);
  await Promise.all([first, second]);
  assert.equal(calls, 1);
  assert.equal(coordinator.isGenerating(lesson.id), false);
});
test('failed generation is not retried automatically, but an explicit retry works', async () => {
  const coordinator = new GenerationCoordinator();
  let calls = 0;
  await assert.rejects(
    coordinator.generate(lesson, async () => {
      calls++;
      throw new Error('offline');
    }),
    /offline/,
  );
  assert.equal(calls, 1);
  await coordinator.generate(lesson, async () => {
    calls++;
    return pack;
  });
  assert.equal(calls, 2);
});
test('PDF and photo inputs use one structured request with no server-side storage', async () => {
  let calls = 0;
  const fakeFetch: typeof fetch = async (url, options) => {
    calls++;
    assert.equal(url, 'https://api.openai.com/v1/responses');
    assert.equal((options?.headers as Record<string, string>).Authorization, 'Bearer test-key');
    const body = JSON.parse(options!.body as string);
    assert.equal(body.store, false);
    assert.equal(body.text.format.strict, true);
    assert.equal(body.input[0].content[1].type, 'input_file');
    assert.equal(body.input[0].content[1].file_data, 'data:application/pdf;base64,YWJj');
    assert.equal(body.input[0].content[2].type, 'input_image');
    assert.equal(body.input[0].content[2].image_url, 'data:image/jpeg;base64,YWJj');
    assert.match(body.input[0].content[0].text, /exactly 5 multiple-choice/);
    return new Response(JSON.stringify(responseBody), { status: 200 });
  };
  const actual = await requestStudyPack(lesson, initialState.settings, 'test-key', {
    fetch: fakeFetch,
    readBase64: async () => 'YWJj',
  });
  assert.deepEqual(actual, pack);
  assert.equal(calls, 1);
});
test('missing API key fails before reading files or sending data', async () => {
  let calls = 0;
  await assert.rejects(
    requestStudyPack(lesson, initialState.settings, ' ', {
      fetch: async () => {
        calls++;
        return new Response();
      },
      readBase64: async () => {
        calls++;
        return '';
      },
    }),
    /API key/,
  );
  assert.equal(calls, 0);
});
test('authentication and quota failures use clear errors without automatic retries', async () => {
  for (const [status, expected] of [
    [401, /key was not accepted/],
    [429, /quota or rate limit/],
  ] as const) {
    let calls = 0;
    await assert.rejects(
      requestStudyPack(lesson, initialState.settings, 'test', {
        fetch: async () => {
          calls++;
          return new Response('{}', { status });
        },
        readBase64: async () => '',
      }),
      expected,
    );
    assert.equal(calls, 1);
  }
});
test('incomplete, refused, and malformed responses do not become saved packs', async () => {
  const responses = [
    [{ status: 'incomplete' }, /incomplete/],
    [{ output: [{ content: [{ type: 'refusal', refusal: 'Unable' }] }] }, /could not use/],
    [{ output: [{ content: [{ type: 'output_text', text: 'invalid JSON' }] }] }, /could not read/],
  ] as const;
  for (const [body, expected] of responses) {
    await assert.rejects(
      requestStudyPack(lesson, initialState.settings, 'test', {
        fetch: async () => new Response(JSON.stringify(body)),
        readBase64: async () => '',
      }),
      expected,
    );
  }
});
test('network failure is actionable and does not reveal credential text', async () => {
  await assert.rejects(
    requestStudyPack(lesson, initialState.settings, 'secret-key', {
      fetch: async () => {
        throw new TypeError('Failed to fetch');
      },
      readBase64: async () => '',
    }),
    (error) =>
      error instanceof Error &&
      /internet connection/.test(error.message) &&
      !error.message.includes('secret-key'),
  );
});

test('non-JSON API responses and invalid payloads fail with a useful message', async () => {
  for (const body of ['<html>unavailable</html>', 'null', '{"output":{}}']) {
    await assert.rejects(
      requestStudyPack(lesson, initialState.settings, 'test', {
        fetch: async () => new Response(body),
        readBase64: async () => '',
      }),
      /unreadable response|did not return/,
    );
  }
});
