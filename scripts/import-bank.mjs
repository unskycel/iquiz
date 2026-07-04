/**
 * iQuiz 题库导入脚本
 * 解析 软件工程题库.md → 按章节写入 Supabase
 *
 * 用法: node --env-file=.env.local scripts/import-bank.mjs
 *
 * 需要环境变量: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// ── 0. 环境变量检查 ─────────────────────────────────
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ 缺少环境变量: SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY');
  console.error('用法: node --env-file=.env.local scripts/import-bank.mjs');
  process.exit(1);
}

// 使用 service_role 绕过 RLS
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
      if (i < maxRetries && (e.code === 'ECONNRESET' || e.code === 'UND_ERR_CONNECT_TIMEOUT' || e.message?.includes('fetch'))) {
        console.warn(`  ⚠️ ${label} 网络错误，重试 ${i+1}/${maxRetries}...`);
        await new Promise(r => setTimeout(r, 1500));
        continue;
      }
      throw e;
    }
  }
}

// ── 1. 读取并解析 Markdown ─────────────────────────────────
const BANK_PATH = process.argv[2] || 'C:/Users/HBRol/Desktop/软件工程题库.md';
const text = readFileSync(BANK_PATH, 'utf-8');
const lines = text.split(/\r?\n/);

/** @typedef {{ chapter: string, type: string, number: number, content: string, options: string[], answer: any }} ParsedQuestion */

/** @type {ParsedQuestion[]} */
const questions = [];

let currentChapter = '';
let currentType = '';     // 'choice' | 'truefalse' | 'fillblank'
let currentNumber = 0;
let contentBuf = [];       // 当前题目内容行
let optionBuf = [];        // 当前题目选项行 (A. xxx / B. xxx)
let answer = null;

function flushQuestion() {
  if (contentBuf.length === 0 || answer === null) return;

  const fullContent = contentBuf.join('\n').trim();
  if (!fullContent) return;

  // 清理答案中的空白和方括号
  let cleanAnswer = typeof answer === 'string' ? answer.trim() : answer;

  questions.push({
    chapter: currentChapter,
    type: currentType,
    number: currentNumber,
    content: fullContent,
    options: [...optionBuf],
    answer: cleanAnswer,
  });

  contentBuf = [];
  optionBuf = [];
  answer = null;
}

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();

  // ── 章/节标题 ──
  const chMatch = trimmed.match(/^第(\d+)章$/);
  if (chMatch) {
    flushQuestion();
    currentChapter = `第${chMatch[1]}章`;
    currentType = '';
    continue;
  }

  // ── 题型标题 ──
  if (trimmed === '一、选择题') {
    flushQuestion();
    currentType = 'choice';
    continue;
  }
  if (trimmed === '二、判断题') {
    flushQuestion();
    currentType = 'truefalse';
    continue;
  }
  if (trimmed === '三、填空题') {
    flushQuestion();
    currentType = 'fillblank';
    continue;
  }

  // ── 答案行 ──
  if (/^答案[：:]/.test(trimmed)) {
    const rawAnswer = trimmed.replace(/^答案[：:]\s*/, '');
    // 判断题: √ / ×
    if (currentType === 'truefalse') {
      answer = rawAnswer.replace(/[（）\(\)]/g, '').trim();
    }
    // 填空题: 可能多空，用 、或，分割
    else if (currentType === 'fillblank') {
      // 统计当前题目中 ______ 的数量来确定是单空还是多空
      const blankCount = (contentBuf.join('\n').match(/______/g) || []).length;
      // 尝试用中文逗号/顿号分割
      const parts = rawAnswer.split(/[、，]/).map(s => s.trim()).filter(Boolean);
      if (blankCount > 1 && parts.length > 1) {
        answer = parts; // 数组
      } else {
        answer = rawAnswer;
      }
    }
    // 选择题: B / C / A
    else {
      answer = rawAnswer.replace(/[（）\(\)]/g, '').trim();
    }
    flushQuestion();
    continue;
  }

  // ── 题目编号行 ──
  const qMatch = trimmed.match(/^(\d+)[.．、]\s*(.+)/);
  if (qMatch) {
    flushQuestion();
    currentNumber = parseInt(qMatch[1]);
    contentBuf.push(qMatch[2]);
    continue;
  }

  // ── 选项行 (选择题) ──
  if (currentType === 'choice') {
    const optMatch = trimmed.match(/^([A-D])[.．、]\s*(.+)/);
    if (optMatch) {
      optionBuf.push(`${optMatch[1]}. ${optMatch[2].trim()}`);
      continue;
    }
  }

  // ── 判断题/填空题的延续行 (多行题目内容) ──
  if (currentNumber > 0 && trimmed && !/^答案[：:]/.test(trimmed)) {
    // 跳过空行和纯分隔线
    if (trimmed.length > 0) {
      contentBuf.push(trimmed);
    }
  }
}
// 最后一道题
flushQuestion();

console.log(`📖 解析完成: 共 ${questions.length} 道题`);
const chapters = [...new Set(questions.map(q => q.chapter))];
console.log(`📚 章节: ${chapters.join(', ')}`);
for (const ch of chapters) {
  const qs = questions.filter(q => q.chapter === ch);
  console.log(`   ${ch}: ${qs.length} 题 (选择${qs.filter(q=>q.type==='choice').length}, 判断${qs.filter(q=>q.type==='truefalse').length}, 填空${qs.filter(q=>q.type==='fillblank').length})`);
}

// ── 2. 写入 Supabase ─────────────────────────────────
console.log('\n🚀 开始写入 Supabase...\n');

const TYPE_MAP = {
  choice: 'single_choice',
  truefalse: 'true_false',
  fillblank: 'fill_blank',
};

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

for (const chapter of chapters) {
  const chapterQuestions = questions.filter(q => q.chapter === chapter);
  if (chapterQuestions.length === 0) continue;

  // 2.1 创建 quiz
  const quizTitle = `软件工程 ${chapter}`;
  let quiz;
  try {
    const result = await retry(
      () => supabase.from('quizzes').insert({
        user_id: QUIZ_OWNER,
        title: quizTitle,
        description: `${chapter} 习题集（含选择题、判断题、填空题）`,
        is_published: true,
      }).select('id').single(),
      `创建 quiz "${quizTitle}"`
    );
    quiz = result.data;
  } catch (e) {
    console.error(`❌ 创建 quiz "${quizTitle}" 失败:`, e.message);
    continue;
  }

  console.log(`📝 [${quizTitle}] quiz_id=${quiz.id}`);

  // 2.2 插入题目
  for (let qi = 0; qi < chapterQuestions.length; qi++) {
    const q = chapterQuestions[qi];
    const qType = TYPE_MAP[q.type] || 'short_answer';

    // 构建 correct_answer
    let correctAnswer;
    if (q.type === 'choice') {
      // single_choice: 只存选项字母，如 "B"
      correctAnswer = q.answer;
    } else if (q.type === 'truefalse') {
      // true_false: "√" 或 "×"
      correctAnswer = q.answer;
    } else if (q.type === 'fillblank') {
      // fill_blank: 字符串或字符串数组
      correctAnswer = q.answer;
    } else {
      correctAnswer = q.answer;
    }

    let question;
    try {
      const result = await retry(
        () => supabase.from('questions').insert({
          quiz_id: quiz.id,
          type: qType,
          content: q.content,
          order_index: qi,
          correct_answer: correctAnswer,
          points: 1,
        }).select('id').single(),
        `Q${q.number}`
      );
      question = result.data;
    } catch (e) {
      console.error(`  ❌ Q${q.number} 插入失败:`, e.message || e);
      continue;
    }

    // 2.3 选择题: 插入选项
    if (q.type === 'choice' && q.options.length > 0) {
      const optionRows = q.options.map((opt, oi) => {
        const label = OPTION_LABELS[oi] || String.fromCharCode(65 + oi);
        const content = opt.replace(/^[A-D][.．、]\s*/, '').trim();
        return {
          question_id: question.id,
          content,
          is_correct: label === q.answer,
          order_index: oi,
        };
      });

      try {
        await retry(
          () => supabase.from('question_options').insert(optionRows),
          `Q${q.number} 选项`
        );
      } catch (e) {
        console.error(`  ⚠️ Q${q.number} 选项插入失败:`, e.message || e);
      }
    }

    process.stdout.write(`  ✅ Q${q.number} [${q.type}] ${q.content.substring(0, 30)}...\n`);
  }

  console.log(`✅ [${quizTitle}] 完成: ${chapterQuestions.length} 题\n`);
}

console.log('\n🎉 全部导入完成！');
