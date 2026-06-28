/**
 * Measurement script: audit all 4 guided topics.
 * Run: npx tsx scripts/audit-guided-topics.ts
 */
import { MPI_TOPIC_CATALOG } from '../src/core/guided-flow/mpi-topic-catalog';
import { generateMpiFromTopic } from '../src/core/guided-flow/generate-mpi-from-topic';
import { checkLearningGoalAlignment } from '../src/core/learning-goal-alignment';
import { validateLayoutQuality } from '../src/core/design/layout-quality';
import { checkMpiStandard } from '../src/core/mpi-quality-check';

console.log('='.repeat(100));
console.log('GUIDED GENERATOR ALIGNMENT QUALITY AUDIT');
console.log('='.repeat(100));
console.log();

const results: Array<{
  topicId: string;
  title: string;
  alignmentScore: number;
  alignmentOk: boolean;
  layoutScore: number;
  layoutOk: boolean;
  mpiOk: boolean;
  errors: string[];
  warnings: string[];
  uncoveredObjectives: number;
  totalObjectives: number;
  issueCodes: string[];
}> = [];

for (const topic of MPI_TOPIC_CATALOG) {
  console.log(`\n--- Topic: ${topic.id} (${topic.mapel} — ${topic.topic}) ---`);

  const { project, qualityReport } = generateMpiFromTopic(topic);
  const alignment = checkLearningGoalAlignment(project);
  const mpi = checkMpiStandard(project);

  // Aggregate layout issues across all pages
  const layoutIssues = project.pages.flatMap((p) =>
    validateLayoutQuality(p).issues.map((i) => ({ ...i, page: p.title })),
  );
  const layoutErrorCount = layoutIssues.filter((i) => i.severity === 'error').length;
  const layoutWarningCount = layoutIssues.filter((i) => i.severity === 'warning').length;
  const layoutScore = Math.max(0, 100 - layoutErrorCount * 20 - layoutWarningCount * 5);

  console.log(`  Pages: ${project.pages.length}`);
  console.log(`  Objectives: ${alignment.totalObjectives} total, ${alignment.coveredObjectives} covered, ${alignment.uncoveredObjectiveIds.length} uncovered`);
  console.log(`  Alignment score: ${alignment.score}/100 (ok=${alignment.ok})`);
  console.log(`  Layout score: ${layoutScore}/100 (errors=${layoutErrorCount}, warnings=${layoutWarningCount})`);
  console.log(`  Layout qualityReport from generator: ${qualityReport.score}/100 (ok=${qualityReport.ok})`);
  console.log(`  MPI standard: pass=${mpi.pass}, errors=${mpi.errors.length}, warnings=${mpi.warnings.length}`);

  console.log(`\n  Alignment issues (${alignment.issues.length}):`);
  for (const issue of alignment.issues) {
    console.log(`    [${issue.severity}] ${issue.code}: ${issue.message}`);
  }

  console.log(`\n  Layout issues (${layoutIssues.length}):`);
  for (const issue of layoutIssues.slice(0, 15)) {
    console.log(`    [${issue.severity}] [${issue.page}] ${issue.code}: ${issue.message}`);
  }
  if (layoutIssues.length > 15) {
    console.log(`    ... and ${layoutIssues.length - 15} more`);
  }

  console.log(`\n  MPI errors:`);
  for (const e of mpi.errors) console.log(`    ${e}`);
  console.log(`  MPI warnings:`);
  for (const w of mpi.warnings) console.log(`    ${w}`);

  // Page-by-page alignment
  console.log(`\n  Page alignment:`);
  for (const pa of alignment.pages) {
    console.log(`    ${pa.pageTitle} (${pa.pageRole}): addressed=${pa.addressedObjectiveIds.length}, issues=${pa.issues.length}`);
  }

  results.push({
    topicId: topic.id,
    title: `${topic.mapel} — ${topic.topic}`,
    alignmentScore: alignment.score,
    alignmentOk: alignment.ok,
    layoutScore,
    layoutOk: layoutErrorCount === 0,
    mpiOk: mpi.pass,
    errors: mpi.errors,
    warnings: mpi.warnings,
    uncoveredObjectives: alignment.uncoveredObjectiveIds.length,
    totalObjectives: alignment.totalObjectives,
    issueCodes: alignment.issues.map((i) => i.code),
  });
}

console.log('\n' + '='.repeat(100));
console.log('SUMMARY TABLE');
console.log('='.repeat(100));
console.log('Topic | Alignment Score | Layout Score | MPI Standard | Errors | Warnings | Verdict');
for (const r of results) {
  const verdict = r.alignmentScore >= 80 && r.layoutScore >= 80 && r.uncoveredObjectives === 0 ? 'PASS' : 'FAIL';
  console.log(`${r.topicId} | ${r.alignmentScore} | ${r.layoutScore} | ${r.mpiOk ? 'PASS' : 'FAIL'} | ${r.errors.length} | ${r.warnings.length} | ${verdict}`);
  console.log(`  Issue codes: ${r.issueCodes.join(', ')}`);
}
