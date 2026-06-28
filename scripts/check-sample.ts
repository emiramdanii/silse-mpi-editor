import { createSamplePpknProject } from '../src/core/sample-project';
import { checkExportQuality } from '../src/core/export-quality-gate';
import { checkMpiStandard } from '../src/core/mpi-quality-check';

const project = createSamplePpknProject();
const report = checkExportQuality(project);
console.log('isClean:', report.isClean);
console.log('level:', report.level);
console.log('fatalIssues:', report.fatalIssues.length);
console.log('warningIssues:', report.warningIssues.length);
console.log('---ALL ISSUES---');
for (const i of report.issues) {
  console.log(`  [${i.level}] [${i.source}] ${i.message}`);
}
console.log('---MPI STANDARD---');
const qc = checkMpiStandard(project);
console.log('pass:', qc.pass);
console.log('errors:', qc.errors);
console.log('warnings:', qc.warnings);
console.log('pages:', project.pages.map(p => p.role));
