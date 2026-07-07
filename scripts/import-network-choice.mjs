/**
 * iQuiz 计算机网络选择题导入脚本
 * 解析 计算机网络题库_选择题.md → 整体写入 Supabase（1 个 quiz，content 前缀【章节名】）
 *
 * 用法: node --env-file=.env.local scripts/import-network-choice.mjs [文件路径]
 *
 * 需要环境变量: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

// ── 0. 环境变量检查 ─────────────────────────────────
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('缺少环境变量: SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY');
  console.error('用法: node --env-file=.env.local scripts/import-network-choice.mjs');
  process.exit(1);
}

const QUIZ_OWNER = process.env.IMPORT_USER_ID || '9f572e01-993b-4ebf-81ef-a244ad016f3c';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ── 网络重试工具 ─────────────────────────────────
async function retry(fn, label, maxRetries = 3) {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      const result = await fn();
      if (result.error) throw result.error;
      return result;
    } catch (e) {
      if (i < maxRetries && (
        e.code === 'ECONNRESET' ||
        e.code === 'UND_ERR_CONNECT_TIMEOUT' ||
        e.message?.includes('fetch')
      )) {
        console.warn(`  ⚠️ ${label} 网络错误，重试 ${i + 1}/${maxRetries}...`);
        await new Promise(r => setTimeout(r, 1500));
        continue;
      }
      throw e;
    }
  }
}

// ── 1. 读取并解析 Markdown ─────────────────────────────────
const BANK_PATH = process.argv[2] || 'C:/Users/HBRol/Desktop/计算机网络题库_选择题.md';
const text = readFileSync(BANK_PATH, 'utf-8');
const lines = text.split(/\r?\n/);

/**
 * @typedef {{
 *   chapter: string,
 *   content: string,
 *   options: Record<string, string>,
 *   answer: string,
 *   explanation: string
 * }} ParsedChoiceQuestion
 */

/** @type {ParsedChoiceQuestion[]} */
const questions = [];

let currentChapter = '';
let contentBuf = [];
/** @type {Record<string, string>} */
let options = {};
let explanationBuf = [];
let answer = null;

function flushQuestion() {
  if (contentBuf.length === 0 || answer === null) return;

  const fullContent = contentBuf.join('\n').trim();
  if (!fullContent) return;

  // 限制最多到 E
  const validOptions = {};
  for (const k of ['A', 'B', 'C', 'D', 'E']) {
    if (options[k]) validOptions[k] = options[k];
  }

  questions.push({
    chapter: currentChapter,
    content: fullContent,
    options: validOptions,
    answer: answer,
    explanation: explanationBuf.join('\n').trim(),
  });

  contentBuf = [];
  options = {};
  explanationBuf = [];
  answer = null;
}

// ── 解析循环 ──
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();

  // ── 章节标题 (## 标题) ──
  const chMatch = trimmed.match(/^##\s+(.+)/);
  if (chMatch) {
    flushQuestion();
    currentChapter = chMatch[1].trim();
    continue;
  }

  // ── 答案行 ──
  if (/^答案[：:]/.test(trimmed)) {
    answer = trimmed.replace(/^答案[：:]\s*/, '').trim().toUpperCase();
    // 标准化：如果答案写的是完整选项文本而非字母，取首字母
    if (answer.length > 2) {
      // 可能是 "正确" 之类，保留原样；如果是选项文本，取首字母
      if (/^[A-E]/.test(answer)) answer = answer[0];
    }
    continue;
  }

  // ── 解析行 ──
  if (/^解析[：:]/.test(trimmed)) {
    const explanation = trimmed.replace(/^解析[：:]\s*/, '').trim();
    if (explanation) {
      explanationBuf.push(explanation);
    }
    continue;
  }

  // ── 选项行 A. / B. / C. / D. / E. ──
  const optMatch = trimmed.match(/^([A-E])[.．、]\s*(.+)/);
  if (optMatch) {
    options[optMatch[1]] = optMatch[2].trim();
    continue;
  }

  // ── 题目编号行 ──
  const qMatch = trimmed.match(/^(\d+)[.．、]\s*(.+)/);
  if (qMatch) {
    flushQuestion();
    contentBuf.push(qMatch[2]);
    continue;
  }

  // ── 表格行（路由表等）→ 归入 content ──
  if (/^\|/.test(trimmed)) {
    contentBuf.push(trimmed);
    continue;
  }

  // ── 其他非空行 → 题目内容延续行 ──
  if (trimmed && !/^答案[：:]/.test(trimmed) && !/^解析[：:]/.test(trimmed)) {
    contentBuf.push(trimmed);
  }
}
// 最后一道题
flushQuestion();

console.log(`📖 解析完成: ${questions.length} 道选择题`);
const chapters = [...new Set(questions.map(q => q.chapter))];
console.log(`📚 章节: ${chapters.join('; ')}`);

for (const ch of chapters) {
  const qs = questions.filter(q => q.chapter === ch);
  const optCounts = {};
  for (const q of qs) {
    const n = Object.keys(q.options).length;
    optCounts[n] = (optCounts[n] || 0) + 1;
  }
  const optInfo = Object.entries(optCounts).map(([k, v]) => `${k}选${v}`).join(', ');
  console.log(`   ${ch}: ${qs.length} 题 (${optInfo})`);
}

// ── 2. 删除旧数据 ─────────────────────────────────
console.log('\n🗑️  清理旧数据...\n');

const { data: existingQuizzes, error: listError } = await retry(
  () => supabase.from('quizzes').select('id, title').ilike('title', '计算机网络%选择%'),
  '查询旧 quiz'
);

if (listError) {
  console.error('查询旧数据失败:', listError.message);
} else if (existingQuizzes && existingQuizzes.length > 0) {
  console.log(`找到 ${existingQuizzes.length} 个旧 quiz:`);
  for (const quiz of existingQuizzes) {
    console.log(`  删除: ${quiz.title} (${quiz.id})`);
    const { error: delError } = await retry(
      () => supabase.from('quizzes').delete().eq('id', quiz.id),
      `删除 quiz ${quiz.title}`
    );
    if (delError) {
      console.error(`  ❌ 删除失败:`, delError.message);
    } else {
      console.log(`  ✅ 已删除`);
    }
  }
} else {
  console.log('未找到旧数据，跳过清理');
}

// ── 3. 写入 Supabase（整体导入为 1 个 quiz）─────────────────
console.log('\n🚀 开始写入 Supabase...\n');

const quizTitle = '计算机网络 - 选择题';
let quiz;
try {
  const result = await retry(
    () => supabase.from('quizzes').insert({
      user_id: QUIZ_OWNER,
      title: quizTitle,
      description: '计算机网络题库 全章节 单选题，共 ' + questions.length + ' 题',
      is_published: true,
    }).select('id').single(),
    `创建 quiz "${quizTitle}"`
  );
  quiz = result.data;
} catch (e) {
  console.error(`❌ 创建 quiz "${quizTitle}" 失败:`, e.message);
  process.exit(1);
}

console.log(`📝 [${quizTitle}] quiz_id=${quiz.id}`);

// 3.2 插入全部题目（按文件顺序，内容前缀【章节名】）
const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E'];
let orderIndex = 0;
for (const q of questions) {
  const taggedContent = `【${q.chapter}】${q.content}`;
  let question;

  // 3.2a 插入题目
  try {
    const result = await retry(
      () => supabase.from('questions').insert({
        quiz_id: quiz.id,
        type: 'single_choice',
        content: taggedContent,
        order_index: orderIndex,
        correct_answer: q.answer,
        points: 1,
        explanation: q.explanation || null,
      }).select('id').single(),
      `Q${orderIndex + 1}`
    );
    question = result.data;
  } catch (e) {
    console.error(`  ❌ #${orderIndex + 1} 插入失败:`, e.message || e);
    continue;
  }

  // 3.2b 插入选项到 question_options 表
  const optionKeys = Object.keys(q.options).sort();
  if (optionKeys.length > 0) {
    const optionRows = optionKeys.map((label, oi) => ({
      question_id: question.id,
      content: q.options[label],
      is_correct: label === q.answer,
      order_index: oi,
    }));

    try {
      await retry(
        () => supabase.from('question_options').insert(optionRows),
        `Q${orderIndex + 1} 选项`
      );
    } catch (e) {
      console.error(`  ⚠️ #${orderIndex + 1} 选项插入失败:`, e.message || e);
    }
  }

  const optCount = optionKeys.length;
  const optPreview = optionKeys.map(k => `${k}.${q.options[k]}`).join(' | ').substring(0, 60);
  process.stdout.write(`  ✅ #${orderIndex + 1} [${optCount}选] ${q.answer} ${q.chapter} ${optPreview}...\n`);
  orderIndex++;
}

console.log(`\n✅ [${quizTitle}] 完成: ${orderIndex}/${questions.length} 题`);
console.log('🎉 全部导入完成！');
