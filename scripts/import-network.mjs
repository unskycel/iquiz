/**
 * 计算机网络题库导入脚本
 * 三个文件分别导入为独立习题
 *
 * 用法: node --env-file=.env.local scripts/import-network.mjs
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

// ── 解析单个文件 ──
function parseFile(filePath) {
  const text = readFileSync(filePath, 'utf-8');
  const lines = text.split(/\r?\n/);
  const questions = [];
  let currentChapter = '';
  let currentContent = '';
  let currentOptions = [];
  let currentAnswer = null;
  let currentExplanation = '';

  function flush() {
    if (!currentContent || currentAnswer === null) return;
    questions.push({
      chapter: currentChapter,
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

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    // 章节标题: ## xxx
    if (trimmed.startsWith('## ') && !trimmed.startsWith('### ')) {
      flush();
      currentChapter = trimmed.replace(/^##\s*/, '');
      continue;
    }

    // 题目编号行: N. xxx
    const qMatch = trimmed.match(/^(\d+)[.．]\s*(.+)/);
    if (qMatch) {
      flush();
      currentContent = qMatch[2];
      continue;
    }

    // 选项行: A. xxx / B. xxx
    const optMatch = trimmed.match(/^([A-D])[.．]\s*(.+)/);
    if (optMatch && currentContent) {
      currentOptions.push(optMatch[2].trim());
      continue;
    }

    // 答案行: 答案：X
    const ansMatch = trimmed.match(/^答案[：:]\s*(.+)/);
    if (ansMatch && currentContent) {
      currentAnswer = ansMatch[1].trim();
      continue;
    }

    // 解析行: 解析：xxx
    const expMatch = trimmed.match(/^解析[：:]\s*(.+)/);
    if (expMatch && currentContent) {
      currentExplanation = expMatch[1];
      continue;
    }

    // 题目内容延续行（填空题可能跨行）
    if (currentContent && !currentAnswer && trimmed && !trimmed.startsWith('##')) {
      currentContent += trimmed;
    }
  }
  flush();
  return questions;
}

// ── 导入一个文件 ──
async function importFile(filePath, quizTitle, typeName) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`📄 解析: ${filePath}`);

  const questions = parseFile(filePath);
  console.log(`📖 共 ${questions.length} 道${typeName}`);

  const chapters = [...new Set(questions.map(q => q.chapter))];
  console.log(`📚 章节: ${chapters.join(', ')}`);

  // 创建习题
  let quiz;
  try {
    const result = await retry(
      () => supabase.from('quizzes').insert({
        user_id: QUIZ_OWNER,
        title: quizTitle,
        description: `计算机网络${typeName}题库（含解析）`,
        is_published: true,
      }).select('id').single(),
      `创建 quiz "${quizTitle}"`
    );
    quiz = result.data;
  } catch (e) {
    console.error(`❌ 创建 quiz 失败:`, e.message);
    return;
  }

  console.log(`📝 quiz_id=${quiz.id}`);

  const OPTION_LABELS = ['A', 'B', 'C', 'D'];

  for (let qi = 0; qi < questions.length; qi++) {
    const q = questions[qi];

    let question;
    try {
      const result = await retry(
        () => supabase.from('questions').insert({
          quiz_id: quiz.id,
          type: typeName === '选择题' ? 'single_choice' : typeName === '判断题' ? 'true_false' : 'fill_blank',
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
      console.error(`  ❌ Q${qi + 1} 失败:`, e.message);
      continue;
    }

    // 选择题: 插入选项
    if (typeName === '选择题' && q.options.length > 0) {
      const optionRows = q.options.map((content, oi) => ({
        question_id: question.id,
        content,
        is_correct: OPTION_LABELS[oi] === q.answer,
        order_index: oi,
      }));
      try {
        await retry(
          () => supabase.from('question_options').insert(optionRows),
          `Q${qi + 1} 选项`
        );
      } catch (e) {
        console.error(`  ⚠️ Q${qi + 1} 选项失败:`, e.message);
      }
    }

    process.stdout.write(`  ✅ Q${qi + 1} ${q.content.substring(0, 45)}...\n`);
  }

  console.log(`✅ [${quizTitle}] 完成: ${questions.length} 题\n`);
}

// ── 主流程 ──
const BASE = 'C:/Users/HBRol/Desktop';

await importFile(`${BASE}/计算机网络题库_选择题.md`, '计算机网络 选择题', '选择题');
await importFile(`${BASE}/计算机网络题库_判断题.md`, '计算机网络 判断题', '判断题');
await importFile(`${BASE}/计算机网络题库_填空题.md`, '计算机网络 填空题', '填空题');

console.log('\n🎉 计算机网络三个题库全部导入完成！');
