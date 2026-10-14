# Study flow

A quiet, native study companion for iOS and Android. Attach lesson photos or PDFs, make a quiz, and keep tomorrow’s classes ready.

Built with Expo SDK 57, React Native, and TypeScript. Screens use native views, text inputs, pickers, and modals. There is no HTML interface or embedded browser.

## Run on your phone

Use Node.js 24 LTS and a current Expo Go version that supports SDK 57.

```sh
npm ci
npm start
```

Scan the QR code with Expo Go on Android or the Camera app on iOS. Your phone and development computer should share a network. If needed, use `npx expo start --tunnel`.

To run a local native build with the appropriate platform tools installed:

```sh
npx expo run:android
# On macOS with Xcode:
npx expo run:ios
```

## Start studying

1. Open Settings using the sliders icon. Paste your **OpenAI API key**, choose a model and quiz length, and save. The default model is `gpt-4.1-mini`; alternatives must support images, PDF input, and structured output through the Responses API. API usage requires OpenAI API billing; a ChatGPT subscription does not include it.
2. Tap **Attach a lesson**. Choose photos, photograph pages, or select PDFs. Give the lesson a title and subject, and optionally specify a focus. Each lesson supports up to eight files and 20 MB total. Photo-library and camera images, including HEIC photos, are converted to JPEG; the Files picker accepts PDF, JPEG, PNG, and WebP.
3. Add the lesson. With a saved key, generation starts automatically. Without a key, sources are saved and you can generate later from the lesson screen. Keep the app open while generation runs; you can browse other screens. Failed requests can be retried explicitly.
4. Open the saved lesson for its summary, key points, quiz, and recap. Quizzes show answer explanations and keep attempt history. Recap includes practice problems or short-answer questions, a space to work, hints, and model answers. Recap answers are self-checked rather than graded with more API calls.
5. In **Periods**, customize subjects, start/end times, repeat weekdays, and room labels. Overlapping periods are flagged. Select **Tomorrow** and attach a library lesson to each period. Assignments apply to that specific date; the weekly timetable repeats. Ready study packs are marked as prepared.

The home screen includes a clearly labeled **sample lesson** for exploring quizzes and recap without a key or API usage.

## Generation and storage

- A single OpenAI request generates the summary, key points, quiz, and five recap questions together. Successful packs are saved on the device and reused for every practice session, including offline practice.
- Content hashes identify repeated attachments. Importing the same set of files reopens the existing lesson, including its saved questions. Renaming the files does not trigger another generation. Changing quiz settings does not regenerate an existing pack.
- Concurrent taps share the same in-flight generation. There are no automatic retries and no regeneration button for completed packs. A failed or timed-out request can still have incurred provider usage; an explicit retry sends a new request. Removing and reimporting a lesson creates a new local entry and can incur new usage.
- The API key is entered manually and stored with Expo SecureStore. It is sent only in the Authorization header to `https://api.openai.com/v1/responses`. No API key is bundled in the app or committed to this repo.
- Generation sends the attached source files, subject, and focus note to OpenAI with `store: false`. Provider retention policies still apply. There is no Study flow backend or account.
- Lessons and source copies, schedules, recap progress, and quiz attempts stay in the app’s local storage. There is no cloud sync. Deleting a lesson removes its local sources, questions, attempts, and timetable assignments. Uninstalling the app may remove its library.
- Study packs are validated before use. Authentication, quota, network, file, and response errors are shown in the app. Storage errors remain visible with a retry-save action; an unreadable library is kept rather than silently replaced.

AI-generated answers can be wrong. Compare them with the original lesson when something seems off.

## Checks

```sh
npm run check          # TypeScript + regression tests
npm run format:check   # Formatting
npm run bundle        # Build iOS and Android Hermes bundles
```

Tests cover request construction for PDFs and images, shared generation, cache reuse, explicit retries, malformed responses, answer scoring, local calendar rollover, period overlap validation, deletion cleanup, and persisted study-pack round trips. GitHub Actions runs these checks and both native bundle exports.

The implementation was checked with TypeScript, automated tests with mocked API responses, and iOS/Android bundle export. A physical-device camera/file-picker smoke test and a live paid API request need to be run with your device and key.

## Installable builds

An `eas.json` preview profile is included. With an Expo account and EAS CLI set up for this repository:

```sh
npx eas-cli build --platform android --profile preview
```

This produces an Android APK. The iOS preview profile targets the simulator; distributing to physical iPhones requires an Apple Developer account and a suitable EAS signing profile. No hosting deployment is needed.

## Code map

- `App.tsx` — native app shell, tabs, screen stack, and Android back handling.
- `src/screens/` — study chat, uploads, lessons, quiz, recap, periods, settings.
- `src/services/` — native file import and the single-request OpenAI integration.
- `src/state/` — local persistence, key storage, generation coordination, and date refresh.
- `src/domain/` — models, study-pack validation, calendar rules, scoring, and sample content.
