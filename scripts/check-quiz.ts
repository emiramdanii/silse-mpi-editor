import { createProject } from '../src/core/project-factory';
import { createComponentId, createPageId } from '../src/core/ids';
import { checkExportQuality } from '../src/core/export-quality-gate';

const project = createProject();
const page = {
  id: createPageId(),
  title: 'Kuis',
  role: 'quiz',
  layoutId: 'blank',
  background: { type: 'color', color: '#fff' },
  components: [
    {
      id: createComponentId(),
      type: 'question',
      variant: 'multipleChoice',
      title: 'Kuis',
      prompt: 'Pengertian norma cek pemahaman',
      choices: [{ id: 'a', text: 'Aturan' }],
      correctChoiceIndex: 0,
      feedbackCorrect: '',
      feedbackWrong: '',
      points: 10,
      scoringStyle: 'points',
      x: 80, y: 80, width: 600, height: 400,
    } as never,
    {
      id: createComponentId(),
      type: 'navigation',
      variant: 'navigation',
      label: 'Lanjut',
      action: 'next',
      x: 900, y: 620, width: 300, height: 60,
    } as never,
  ],
};
project.curriculum = {
  subject: 'Test', grade: '7', phase: 'D', topic: 'Test',
  objectives: [{ id: createComponentId(), text: 'Menjelaskan pengertian norma cek pemahaman' }],
};
project.pages = [page];
project.currentPageId = page.id;

const report = checkExportQuality(project);
console.log('fatal:', report.fatalIssues.length);
console.log('warning:', report.warningIssues.length);
for (const i of report.issues) {
  console.log(`  [${i.level}] [${i.source}] ${i.message}`);
}
