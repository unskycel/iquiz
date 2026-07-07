/**
 * iQuiz 计算机网络判断题导入脚本
 * 解析 计算机网络题库_判断题.md → 整体写入 Supabase（1 个 quiz，content 前缀【章节名】）
 *
 * 用法: node --env-file=.env.local scripts/import-network-truefalse.mjs [文件路径]
 *
 * 需要环境变量: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

// ── 0. 环境变量检查 ─────────────────────────────────
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('缺少环境变量: SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY');
  console.error('用法: node --env-file=.env.local scripts/import-network-truefalse.mjs');
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
const BANK_PATH = process.argv[2] || 'C:/Users/HBRol/Desktop/计算机网络题库_判断题.md';
const text = readFileSync(BANK_PATH, 'utf-8');
const lines = text.split(/\r?\n/);

/** @typedef {{ chapter: string, content: string, answer: string, explanation: string }} ParsedTfQuestion */

/** @type {ParsedTfQuestion[]} */
const questions = [];

let currentChapter = '';
let contentBuf = [];
let explanationBuf = [];
let answer = null;

function flushQuestion() {
  if (contentBuf.length === 0 || answer === null) return;

  const fullContent = contentBuf.join('\n').trim();
  if (!fullContent) return;

  // 标准化答案
  const normalized = answer.includes('正确') ? '正确' : '错误';

  questions.push({
    chapter: currentChapter,
    content: fullContent,
    answer: normalized,
    explanation: explanationBuf.join('\n').trim(),
  });

  contentBuf = [];
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
    answer = trimmed.replace(/^答案[：:]\s*/, '').trim();
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

  // ── 题目编号行 ──
  const qMatch = trimmed.match(/^(\d+)[.．、]\s*(.+)/);
  if (qMatch) {
    flushQuestion();
    contentBuf.push(qMatch[2]);
    continue;
  }

  // ── 非空行 → 题目内容延续行 ──
  if (trimmed && !/^答案[：:]/.test(trimmed) && !/^解析[：:]/.test(trimmed)) {
    contentBuf.push(trimmed);
  }
}
// 最后一道题
flushQuestion();

console.log(`📖 解析完成: ${questions.length} 道判断题`);
const chapters = [...new Set(questions.map(q => q.chapter))];
console.log(`📚 章节: ${chapters.join('; ')}`);

for (const ch of chapters) {
  const qs = questions.filter(q => q.chapter === ch);
  const correct = qs.filter(q => q.answer === '正确').length;
  const wrong = qs.filter(q => q.answer === '错误').length;
  console.log(`   ${ch}: ${qs.length} 题 (正确 ${correct}, 错误 ${wrong})`);
}

// ── 2. 删除旧数据 ─────────────────────────────────
console.log('\n🗑️  清理旧数据...\n');

const { data: existingQuizzes, error: listError } = await retry(
  () => supabase.from('quizzes').select('id, title').ilike('title', '计算机网络%判断%'),
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

const quizTitle = '计算机网络 - 判断题';
let quiz;
try {
  const result = await retry(
    () => supabase.from('quizzes').insert({
      user_id: QUIZ_OWNER,
      title: quizTitle,
      description: '计算机网络题库 全章节 判断题，共 ' + questions.length + ' 题',
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
let orderIndex = 0;
for (const q of questions) {
  const taggedContent = `【${q.chapter}】${q.content}`;

  try {
    await retry(
      () => supabase.from('questions').insert({
        quiz_id: quiz.id,
        type: 'true_false',
        content: taggedContent,
        order_index: orderIndex,
        correct_answer: q.answer,
        points: 1,
        explanation: q.explanation || null,
      }).select('id'),
      `Q${orderIndex + 1}`
    );

    const ansLabel = q.answer === '正确' ? '✅' : '❌';
    process.stdout.write(`  ${ansLabel} #${orderIndex + 1} ${q.chapter} ${q.content.substring(0, 35)}...\n`);
    orderIndex++;
  } catch (e) {
    console.error(`  ❌ #${orderIndex + 1} 插入失败:`, e.message || e);
  }
}

console.log(`\n✅ [${quizTitle}] 完成: ${orderIndex}/${questions.length} 题`);
console.log('🎉 全部导入完成！');
