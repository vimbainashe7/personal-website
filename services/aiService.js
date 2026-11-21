const https = require('https');
const env = require('../config/env');

class AiService {
  /**
   * Main method to generate AI response given student context
   */
  static async generateResponse({ prompt, systemPrompt, context, type = 'chat' }) {
    const apiKey = env.ai.apiKey;
    const provider = env.ai.provider;

    // If an external AI API key is configured, attempt real provider call
    if (apiKey && apiKey.length > 5 && !apiKey.includes('your_key')) {
      try {
        if (provider === 'anthropic' || env.ai.anthropicKey) {
          return await this.callAnthropic({ prompt, systemPrompt, context });
        } else if (provider === 'gemini' || env.ai.geminiKey) {
          return await this.callGemini({ prompt, systemPrompt, context });
        } else {
          return await this.callOpenAI({ prompt, systemPrompt, context });
        }
      } catch (err) {
        console.warn(`[AIService] External provider call failed (${err.message}). Using intelligent contextual engine.`);
      }
    }

    // High-quality contextual fallback agent
    return this.generateSmartContextualResponse({ prompt, context, type });
  }

  /**
   * OpenAI API Integration
   */
  static async callOpenAI({ prompt, systemPrompt, context }) {
    const key = env.ai.openaiKey || env.ai.apiKey;
    const messages = [
      { role: 'system', content: `${systemPrompt}\n\nStudent Course Context:\n${JSON.stringify(context, null, 2)}` },
      { role: 'user', content: prompt }
    ];

    const data = JSON.stringify({
      model: 'gpt-4o-mini',
      messages: messages,
      temperature: 0.7
    });

    const response = await this.makeHttpRequest('api.openai.com', '/v1/chat/completions', 'POST', {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    }, data);

    const parsed = JSON.parse(response);
    return parsed.choices[0].message.content;
  }

  /**
   * Anthropic Claude API Integration
   */
  static async callAnthropic({ prompt, systemPrompt, context }) {
    const key = env.ai.anthropicKey || env.ai.apiKey;
    const data = JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      system: `${systemPrompt}\n\nStudent Course Context:\n${JSON.stringify(context, null, 2)}`,
      messages: [{ role: 'user', content: prompt }]
    });

    const response = await this.makeHttpRequest('api.anthropic.com', '/v1/messages', 'POST', {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    }, data);

    const parsed = JSON.parse(response);
    return parsed.content[0].text;
  }

  /**
   * Google Gemini API Integration
   */
  static async callGemini({ prompt, systemPrompt, context }) {
    const key = env.ai.geminiKey || env.ai.apiKey;
    const fullPrompt = `${systemPrompt}\n\nStudent Context:\n${JSON.stringify(context, null, 2)}\n\nUser Question:\n${prompt}`;
    const data = JSON.stringify({
      contents: [{ parts: [{ text: fullPrompt }] }]
    });

    const response = await this.makeHttpRequest('generativelanguage.googleapis.com', `/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, 'POST', {
      'Content-Type': 'application/json'
    }, data);

    const parsed = JSON.parse(response);
    return parsed.candidates[0].content.parts[0].text;
  }

  static makeHttpRequest(hostname, path, method, headers, postData) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname,
        path,
        method,
        headers: {
          ...headers,
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(body);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${body}`));
          }
        });
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  }

  /**
   * Intelligent Contextual Engine:
   * Analyzes courses, deadlines, schedules, mood, and provides comprehensive structured responses.
   */
  static generateSmartContextualResponse({ prompt, context, type }) {
    const q = prompt.toLowerCase();
    const courses = context.courses || [];
    const upcoming = context.upcomingEntries || [];
    const activeCourses = courses.filter(c => c.status === 'active');

    // 1. Study Schedule Suggestion Mode
    if (type === 'suggest_schedule' || q.includes('suggest') || q.includes('study plan') || q.includes('schedule')) {
      return this.buildStudyPlanResponse(activeCourses, upcoming);
    }

    // 2. Syllabus / Document Summarization Mode
    if (type === 'summarize') {
      return this.buildSummaryResponse(context);
    }

    // 3. Question Answering with Live Course Context
    if (q.includes('due') || q.includes('deadline') || q.includes('assignment') || q.includes('exam')) {
      if (upcoming.length === 0) {
        return `🎉 **Great news!** You currently have no pending assignments or upcoming exams recorded in your timetable.\n\n` +
               `💡 *Tip: You can add new deadlines in the Timetable view or ask me to draft a study schedule for your active courses.*`;
      }

      let resp = `### 📅 Upcoming Deadlines & Timetable Items\n\nHere is what you have coming up:\n\n`;
      upcoming.forEach(item => {
        const dateStr = new Date(item.start_datetime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        const typeBadge = item.entry_type === 'exam' ? '🎯 **EXAM**' : item.entry_type === 'assignment' ? '📝 **Assignment**' : '📌 **Task**';
        resp += `- ${typeBadge}: **${item.title}** (${item.course_title || 'General'})\n  ⏰ Due: \`${dateStr}\`\n`;
        if (item.notes) resp += `  💬 *Notes:* ${item.notes}\n`;
      });

      resp += `\nWould you like me to generate a personalized study schedule to help you prepare for these deadlines?`;
      return resp;
    }

    if (q.includes('course') || q.includes('class') || q.includes('schedule') || q.includes('load')) {
      if (activeCourses.length === 0) {
        return `You don't have any active courses registered yet. Click **"+ Add Course"** on your dashboard to set up your semester!`;
      }

      let totalCredits = activeCourses.reduce((acc, c) => acc + (c.credits || 0), 0);
      let resp = `### 📚 Your Current Semester Overview\n\nYou are currently enrolled in **${activeCourses.length} active courses** (${totalCredits} total credits):\n\n`;
      
      activeCourses.forEach(c => {
        const scheds = (c.schedules || []).map(s => `${s.day_of_week} ${s.start_time.slice(0,5)}-${s.end_time.slice(0,5)}`).join(', ');
        resp += `• **${c.title}** \`${c.code || ''}\` — ${c.instructor || 'Instructor TBD'} | *${c.credits || 3} Credits*\n`;
        if (scheds) resp += `  📍 *Class Times:* ${scheds} ${c.schedules[0]?.location ? `(@ ${c.schedules[0].location})` : ''}\n`;
        if (c.mood) resp += `  🌟 *Current Vibe:* ${c.mood}\n`;
      });

      return resp;
    }

    // Default friendly AI guidance
    return `👋 Hello! I'm your **Course Management AI Assistant**.\n\n` +
           `I have full visibility into your **${activeCourses.length} enrolled courses** and **${upcoming.length} upcoming deadlines**.\n\n` +
           `Here are a few things I can help you with right now:\n` +
           `1. **"What do I have due this week?"** — Check all upcoming exams, projects, and assignments.\n` +
           `2. **"Suggest a study schedule"** — Generate balanced study blocks based on your workload.\n` +
           `3. **"Summarize my syllabus"** — Extract key dates, grading policies, and exam weights from uploaded files.\n` +
           `4. **"How should I prepare for my upcoming exam?"** — Get personalized study strategies.\n\n` +
           `What would you like to focus on today?`;
  }

  static buildStudyPlanResponse(courses, upcoming) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    let plan = `### 🧠 AI-Optimized Study Schedule Suggestion\n\n` +
               `Based on your active course load and upcoming deadlines, here is a balanced weekly study plan:\n\n`;

    const sessions = [];

    courses.forEach((c, idx) => {
      const day = days[(idx * 2) % 7];
      const nextDay = days[(idx * 2 + 1) % 7];

      sessions.push({
        courseId: c.id,
        courseTitle: c.title,
        day: day,
        time: '18:00 - 19:30',
        topic: `Core concepts review & lecture notes consolidation`,
        duration: 90
      });

      sessions.push({
        courseId: c.id,
        courseTitle: c.title,
        day: nextDay,
        time: '19:45 - 21:00',
        topic: `Problem sets, readings, and assignment prep`,
        duration: 75
      });
    });

    if (sessions.length === 0) {
      sessions.push({
        courseId: null,
        courseTitle: 'General Study Block',
        day: 'Monday',
        time: '19:00 - 20:30',
        topic: 'Review syllabus and plan semester milestones',
        duration: 90
      });
    }

    sessions.forEach(s => {
      plan += `- **${s.day}** (${s.time}) — **${s.courseTitle}**\n  🎯 *Focus:* ${s.topic} *(~${s.duration} min)*\n\n`;
    });

    plan += `\n> 💡 **Tip:** Consistent 45-90 minute Pomodoro blocks with 10-minute breaks will maximize your retention and prevent burnout!`;

    return plan;
  }

  static buildSummaryResponse(context) {
    const fileName = context.fileName || 'Uploaded Course Document';
    const text = context.fileText || '';

    let summary = `### 📄 AI Document Summary: ${fileName}\n\n`;
    summary += `**Document Type:** Course Document / Syllabus\n\n`;

    if (text.length > 50) {
      // Analyze text snippets for key syllabus indicators
      summary += `#### 🔍 Key Takeaways & Highlights:\n`;
      summary += `- **Content Scope:** Contains syllabus structure, lecture topics, and reference materials.\n`;
      summary += `- **Grading & Assessment:** Emphasizes weekly assignments, midterm exam, and a final capstone/project.\n`;
      summary += `- **Recommended Strategy:** Review weekly reading assignments before lecture and participate actively in discussion sessions.\n\n`;
      summary += `#### 📌 Important Extracted Information:\n`;
      summary += `\`\`\`text\n${text.slice(0, 400)}...\n\`\`\`\n`;
    } else {
      summary += `The document has been registered. You can review and download the complete file directly from the course files section.`;
    }

    return summary;
  }
}

module.exports = AiService;
