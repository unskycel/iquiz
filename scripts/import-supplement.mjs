/**
 * 补充题库导入脚本
 * 解析 软件工程补充题目.md → 按章节写入 Supabase
 *
 * 用法: node --env-file=.env.local scripts/import-supplement.mjs
 */

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ 缺少环境变量');
  process.exit(1);
}

const QUIZ_OWNER = process.env.IMPORT_USER_ID || '9f572e01-993b-4ebf-81ef-a244ad016f3c';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function retry(fn, label, maxRetries = 3) {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      const result = await fn();
      if (result.error) throw result.error;
      return result;
    } catch (e) {
      if (i < maxRetries && e.message?.includes('fetch')) {
        console.warn(`  ⚠️ ${label} 重试 ${i + 1}/${maxRetries}...`);
        await new Promise(r => setTimeout(r, 1500));
        continue;
      }
      throw e;
    }
  }
}

// ── 解析补充题库 ──
const BANK_PATH = process.argv[2] || 'C:/Users/HBRol/Desktop/软件工程补充题目.md';
const text = readFileSync(BANK_PATH, 'utf-8');

const TYPE_MAP = {
  '单选题': 'single_choice',
  '多选题': 'multiple_choice',
  '判断题': 'true_false',
  '填空题': 'fill_blank',
};

const questions = [];
let currentChapter = '';
let currentType = '';
let currentContent = '';
let currentOptions = [];
let currentAnswer = null;
let currentExplanation = '';

function flushQuestion() {
  if (!currentContent || currentAnswer === null) return;
  questions.push({
    chapter: currentChapter,
    type: currentType,
    content: currentContent.trim(),
    options: [...currentOptions],
    answer: currentAnswer,
    explanation: currentExplanation.trim(),
  });
  currentContent = '';
  currentOptions = [];
  currentAnswer = null;
  currentExplanation = '';
}

// 按行解析
const lines = text.split(/\r?\n/);
let i = 0;
while (i < lines.length) {
  const line = lines[i];
  const trimmed = line.trim();

  // 章节标题: ### N. 第X章 · 名称
  const chMatch = trimmed.match(/^###\s+\d+\.\s+(第.+章.*)/);
  if (chMatch) {
    flushQuestion();
    currentChapter = chMatch[1].replace(/\s*·\s*/, ' ');
    i++;
    continue;
  }

  // 题目行: **【单选题】 ...** 或 **【判断题】 ...** 或 **【填空题】 ...**
  const qMatch = trimmed.match(/^\*\*【(单选题|多选题|判断题|填空题)】\s*(.+?)\*\*$/);
  if (qMatch) {
    flushQuestion();
    currentType = TYPE_MAP[qMatch[1]];
    currentContent = qMatch[2];
    i++;

    // 收集选项和答案（都在 blockquote 里）
    while (i < lines.length) {
      const l = lines[i].trim();

      // 答案行
      const ansMatch = l.match(/^>\s*\*\*【答案】\s*(.+?)\*\*/);
      if (ansMatch) {
        let raw = ansMatch[1].trim();
        if (currentType === 'true_false') {
          currentAnswer = raw.replace(/[（）\(\)]/g, '').trim();
        } else if (currentType === 'fill_blank') {
          const parts = raw.split(/[；;、]/).map(s => s.trim()).filter(Boolean);
          const blankCount = (currentContent.match(/______/g) || []).length;
          currentAnswer = (blankCount > 1 && parts.length > 1) ? parts : raw;
        } else {
          currentAnswer = raw.replace(/[（）\(\)]/g, '').trim();
        }
        i++;
        // 下一行可能是解析
        if (i < lines.length && lines[i].trim().match(/^>\s*【解析】/)) {
          currentExplanation = lines[i].trim().replace(/^>\s*【解析】\s*/, '');
          i++;
        }
        break;
      }

      // 选项行: > A. xxx 或 > B. xxx
      const optMatch = l.match(/^>\s*([A-D])[.．、]\s*(.+)/);
      if (optMatch) {
        currentOptions.push(optMatch[2].trim());
        i++;
        continue;
      }

      // 跳过空的 blockquote 行
      if (l === '>' || l === '') {
        i++;
        continue;
      }

      break;
    }
    continue;
  }

  i++;
}
flushQuestion();

console.log(`📖 解析完成: 共 ${questions.length} 道题`);
const chapters = [...new Set(questions.map(q => q.chapter))];
console.log(`📚 章节: ${chapters.join(', ')}`);
for (const ch of chapters) {
  const qs = questions.filter(q => q.chapter === ch);
  console.log(`   ${ch}: ${qs.length} 题 (选择${qs.filter(q => q.type === 'single_choice').length}, 判断${qs.filter(q => q.type === 'true_false').length}, 填空${qs.filter(q => q.type === 'fill_blank').length})`);
}

// ── 写入 Supabase ──
console.log('\n🚀 开始写入 Supabase...\n');

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

for (const chapter of chapters) {
  const chapterQuestions = questions.filter(q => q.chapter === chapter);
  if (chapterQuestions.length === 0) continue;

  const quizTitle = `软件工程补充 ${chapter}`;
  let quiz;
  try {
    const result = await retry(
      () => supabase.from('quizzes').insert({
        user_id: QUIZ_OWNER,
        title: quizTitle,
        description: `${chapter} 补充习题集`,
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

  for (let qi = 0; qi < chapterQuestions.length; qi++) {
    const q = chapterQuestions[qi];

    let question;
    try {
      const result = await retry(
        () => supabase.from('questions').insert({
          quiz_id: quiz.id,
          type: q.type,
          content: q.content,
          order_index: qi,
          correct_answer: q.answer,
          points: 1,
          explanation: q.explanation || null,
        }).select('id').single(),
        `Q${qi + 1}`
      );
      question = result.data;
    } catch (e) {
      console.error(`  ❌ Q${qi + 1} 插入失败:`, e.message || e);
      continue;
    }

    // 选择题: 插入选项
    if ((q.type === 'single_choice' || q.type === 'multiple_choice') && q.options.length > 0) {
      const optionRows = q.options.map((content, oi) => ({
        question_id: question.id,
        content,
        is_correct: q.type === 'multiple_choice'
          ? q.answer.includes(OPTION_LABELS[oi])
          : OPTION_LABELS[oi] === q.answer,
        order_index: oi,
      }));

      try {
        await retry(
          () => supabase.from('question_options').insert(optionRows),
          `Q${qi + 1} 选项`
        );
      } catch (e) {
        console.error(`  ⚠️ Q${qi + 1} 选项插入失败:`, e.message || e);
      }
    }

    process.stdout.write(`  ✅ Q${qi + 1} [${q.type}] ${q.content.substring(0, 40)}...\n`);
  }

  console.log(`✅ [${quizTitle}] 完成: ${chapterQuestions.length} 题\n`);
}

console.log('\n🎉 补充题库导入完成！');
