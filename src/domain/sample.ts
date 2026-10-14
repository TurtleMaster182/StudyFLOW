import { Lesson } from './types';

export const sampleLesson: Lesson = {
  id: 'sample-photosynthesis',
  title: 'How plants turn light into life',
  subject: 'Biology · Sample',
  note: '',
  createdAt: '2026-01-01T12:00:00Z',
  fingerprint: 'sample-photosynthesis-v1',
  attachments: [],
  attempts: [],
  recapSeen: [],
  generatedAt: '2026-01-01T12:00:00Z',
  model: 'Built-in sample · no API request',
  pack: {
    title: 'Photosynthesis',
    summary:
      'Plants use light energy to convert carbon dioxide and water into glucose, releasing oxygen. Chlorophyll in chloroplasts absorbs the light. The glucose stores chemical energy that plants can use for growth and respiration.',
    keyPoints: [
      'Photosynthesis takes place in chloroplasts.',
      'Chlorophyll absorbs light energy.',
      'Carbon dioxide and water are the reactants; glucose and oxygen are the products.',
      'Light intensity, carbon dioxide concentration, and temperature can limit the rate.',
    ],
    quiz: [
      {
        question: 'Which organelle is the main site of photosynthesis?',
        options: ['Mitochondrion', 'Chloroplast', 'Nucleus', 'Ribosome'],
        correctIndex: 1,
        explanation:
          'Chloroplasts contain chlorophyll, which absorbs the light energy used in photosynthesis.',
      },
      {
        question:
          'A plant receives light and water but no carbon dioxide. What is most likely to happen?',
        options: [
          'Glucose production increases',
          'Oxygen replaces carbon dioxide as a reactant',
          'Photosynthesis is limited',
          'Chlorophyll becomes unnecessary',
        ],
        correctIndex: 2,
        explanation:
          'Carbon dioxide is a required reactant. Without it, the plant cannot sustain glucose production through photosynthesis.',
      },
      {
        question: 'What happens to light energy during photosynthesis?',
        options: [
          'It is stored as chemical energy in glucose',
          'It is converted into carbon dioxide',
          'It becomes water',
          'It is only reflected by leaves',
        ],
        correctIndex: 0,
        explanation:
          'Photosynthesis transfers light energy into chemical energy stored in glucose.',
      },
      {
        question: 'Which pair lists the reactants of photosynthesis?',
        options: [
          'Glucose and oxygen',
          'Water and oxygen',
          'Glucose and carbon dioxide',
          'Carbon dioxide and water',
        ],
        correctIndex: 3,
        explanation:
          'The plant uses carbon dioxide and water to make glucose and oxygen with energy from light.',
      },
      {
        question: 'Why can adding more light eventually stop increasing the photosynthesis rate?',
        options: [
          'All chloroplasts disappear',
          'Another factor becomes limiting',
          'Plants no longer need glucose',
          'Water stops being a reactant',
        ],
        correctIndex: 1,
        explanation:
          'At sufficiently high light intensity, another factor such as carbon dioxide concentration or temperature can limit the rate.',
      },
    ],
    recap: [
      {
        question: 'Write the word equation for photosynthesis.',
        answer:
          'Carbon dioxide + water → glucose + oxygen, using light energy absorbed by chlorophyll.',
        hint: 'Name two reactants and two products.',
      },
      {
        question:
          'Explain why a plant kept in darkness produces less glucose through photosynthesis.',
        answer:
          'Without light, chlorophyll cannot absorb the energy needed to drive photosynthesis, so glucose production through this process falls.',
        hint: 'Think about where the energy comes from.',
      },
      {
        question: 'How is a chloroplast different from chlorophyll?',
        answer:
          'A chloroplast is the organelle where photosynthesis takes place. Chlorophyll is the light-absorbing pigment inside it.',
        hint: 'One is a structure; the other is a pigment.',
      },
      {
        question:
          'A plant has plenty of water and light. Suggest another factor that could limit its photosynthesis rate.',
        answer:
          'Low carbon dioxide concentration could limit the rate. An unsuitable temperature could also limit it.',
        hint: 'Consider another reactant or the effect of temperature.',
      },
      {
        question: 'Explain how sunlight becomes useful stored energy for a plant.',
        answer:
          'Chlorophyll absorbs sunlight. Photosynthesis uses that energy to make glucose from carbon dioxide and water, storing energy in chemical form.',
        hint: 'Connect chlorophyll, photosynthesis, and glucose.',
      },
    ],
  },
};
