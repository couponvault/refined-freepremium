const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

/**
 * YoFan Gemini-Powered Auto-Posting Bot
 * 
 * Features:
 * 1. Log in to YoFan using credentials (or logged-in profile).
 * 2. Uses Gemini API to generate post Title, 500-word Summary/Article, and Image prompt.
 * 3. Generates HD Image locally and saves to PC scratch directory.
 * 4. Uses Brave Browser (or Chrome fallback) to block annoying AdSense ads.
 * 5. Uploads image, title, and 500-word content to YoFan automatically.
 * 6. Deletes the temporary image from PC after successful upload.
 */

// Credentials configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const YOFAN_EMAIL = process.env.YOFAN_EMAIL || 'shivammmaurya2003@gmail.com';
const YOFAN_PASSWORD = process.env.YOFAN_PASSWORD || '9935@Sandesh';

const NICHES = [
  'Tech & AI Innovations',
  'Luxury Travel Destinations',
  'Health & Mindfulness',
  'Modern Architecture & Interior Design',
  'Financial Freedom & Wealth Strategies',
  'Future Electric & Autonomous Vehicles',
  'Minimalist Productive Lifestyle'
];

/**
 * Finds Brave Browser or Chrome executable on Windows
 */
function getBrowserExecutablePath() {
  const possiblePaths = [
    'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
    'C:\\Program Files (x86)\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
    path.join(process.env.LOCALAPPDATA || '', 'BraveSoftware\\Brave-Browser\\Application\\brave.exe'),
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      console.log(`[YoFan Bot] Found Browser Executable: ${p}`);
      return p;
    }
  }
  console.log(`[YoFan Bot] Browser executable not found in default paths, falling back to Playwright Chromium.`);
  return undefined;
}

/**
 * Generates Title, 500-word Content, and Image Prompt using Gemini API
 */
async function generateGeminiContent(niche) {
  if (!GEMINI_API_KEY) {
    console.log(`[Gemini API] GEMINI_API_KEY not found in .env, using default template...`);
    return getFallbackContent(niche);
  }

  console.log(`[Gemini API] Requesting AI Content for Niche: "${niche}"...`);
  try {
    const promptText = `You are an expert digital publisher. Create a high quality post about "${niche}".
Return ONLY a valid JSON object with the following structure (no markdown formatting, no markdown ticks):
{
  "title": "A viral title under 60 characters",
  "content": "A detailed 500-word article with introduction, key points, actionable advice, and conclusion",
  "imagePrompt": "A vivid 1-sentence prompt for an HD photo representing ${niche}"
}`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    });

    const data = await res.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (rawText) {
      const parsed = JSON.parse(rawText);
      console.log(`[Gemini API] Generated Title: "${parsed.title}"`);
      return parsed;
    }
  } catch (err) {
    console.error(`[Gemini API Error] ${err.message}. Falling back to default.`);
  }

  return getFallbackContent(niche);
}

function getFallbackContent(niche) {
  return {
    title: `Exploring the Impact of ${niche}`,
    content: `
Welcome to our detailed guide on ${niche}. In recent years, this topic has captured global interest due to fast-paced developments and practical benefits.

### Understanding the Essentials of ${niche}
At its core, ${niche} represents a paradigm shift. Individuals and organizations adapting to these principles experience higher productivity, clearer strategy, and superior outcomes. Key pillars include:

1. **Innovation & Adaptability:** Staying informed on emerging strategies.
2. **Quality Execution:** Maintaining consistency and accuracy across every project.
3. **Strategic Tools:** Utilizing automation and modern insights.

### Practical Tips for Everyday Success
- Set clear daily objectives.
- Monitor your progress using digital tools.
- Engage with vibrant community discussions.

### Conclusion
Embracing ${niche} opens up exciting new possibilities for growth and success. Keep experimenting and building your knowledge daily!
    `.trim(),
    imagePrompt: `High quality cinematic photo of ${niche}`
  };
}

/**
 * Generates an HD image based on prompt and saves it locally to PC
 */
async function generateAndSaveImage(imagePrompt) {
  const scratchDir = path.join(__dirname, '../scratch');
  if (!fs.existsSync(scratchDir)) {
    fs.mkdirSync(scratchDir, { recursive: true });
  }

  const filename = `temp_yofan_${Date.now()}_${Math.floor(Math.random() * 1000)}.jpg`;
  const filePath = path.join(scratchDir, filename);

  console.log(`[Image Engine] Generating HD image for prompt: "${imagePrompt}"...`);
  const encodedPrompt = encodeURIComponent(imagePrompt);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1200&height=800&nologo=true&seed=${Math.floor(Math.random() * 100000)}`;

  const res = await fetch(imageUrl);
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  fs.writeFileSync(filePath, buffer);
  console.log(`[Image Engine] Saved temporary image file to PC: ${filePath}`);
  return filePath;
}

/**
 * Deletes temporary image file after successful posting
 */
function deleteLocalImage(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[Cleanup] Deleted local temporary image: ${filePath}`);
    }
  } catch (err) {
    console.error(`[Cleanup Error] Failed to delete file: ${err.message}`);
  }
}

/**
 * YoFan Login Automation
 */
async function loginYoFan(page) {
  console.log(`[YoFan Auth] Navigating to sign-in page...`);
  await page.goto('https://yo.fan/auth/sign-in', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Check if already logged in
  if (page.url().includes('/auth/sign-in')) {
    console.log(`[YoFan Auth] Entering credentials for ${YOFAN_EMAIL}...`);
    
    const emailInput = page.locator('input[placeholder*="email"]').first();
    const passwordInput = page.locator('input[placeholder*="password"]').first();
    
    await emailInput.fill(YOFAN_EMAIL);
    await passwordInput.fill(YOFAN_PASSWORD);
    
    const loginBtn = page.locator('button:has-text("Login"), .auth-button').first();
    await loginBtn.click();
    
    console.log(`[YoFan Auth] Submitted login. Waiting for dashboard redirect...`);
    await page.waitForNavigation({ timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(3000);
  } else {
    console.log(`[YoFan Auth] Already logged in!`);
  }
}

/**
 * Upload Post to YoFan
 */
async function uploadToYoFan(page, imagePath, title, content) {
  console.log(`[YoFan Post] Opening post creator...`);
  await page.goto('https://yo.fan', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Click top-right plus button
  const plusBtn = page.locator('.profile-action__add').first();
  await plusBtn.click();
  await page.waitForTimeout(1500);

  // Select "New post"
  const newPostItem = page.locator('text="New post"').first();
  await newPostItem.click();
  await page.waitForTimeout(1500);

  // Upload local image file from PC
  console.log(`[YoFan Post] Selecting local image file...`);
  const fileInput = page.locator('input[type="file"]:not([capture])').first();
  await fileInput.setInputFiles(imagePath);
  await page.waitForTimeout(4000);

  // Confirm image crop/checkmark if visible
  const checkmark = page.locator('.submit-block, button:has-text("Save"), app-icon[name="check"]').first();
  if (await checkmark.isVisible().catch(() => false)) {
    await checkmark.click();
    await page.waitForTimeout(2000);
  }

  // Remove any blocking Google Ad overlays if present
  await page.evaluate(() => {
    document.querySelectorAll('.adsbygoogle-noablate').forEach(el => el.remove());
  }).catch(() => {});

  // Add Title
  console.log(`[YoFan Post] Typing title: "${title}"`);
  const addTitleBtn = page.locator('text="Add title"').first();
  if (await addTitleBtn.isVisible().catch(() => false)) {
    await addTitleBtn.click();
    await page.waitForTimeout(1000);
    await page.fill('textarea, input[placeholder*="title"]', title);
    await page.click('.submit-block, button:has-text("Save")').catch(() => {});
    await page.waitForTimeout(1500);
  }

  // Add 500-word Description / Summary
  console.log(`[YoFan Post] Typing 500-word summary...`);
  const addDescBtn = page.locator('text="Add description", text="Add content"').first();
  if (await addDescBtn.isVisible().catch(() => false)) {
    await addDescBtn.click();
    await page.waitForTimeout(1000);
    await page.fill('textarea, div[contenteditable="true"]', content);
    await page.click('.submit-block, button:has-text("Save")').catch(() => {});
    await page.waitForTimeout(1500);
  }

  // Click Publish
  console.log(`[YoFan Post] Clicking Publish...`);
  const publishBtn = page.locator('.submit-block, button:has-text("Publish")').first();
  if (await publishBtn.isVisible().catch(() => false)) {
    await publishBtn.click();
    await page.waitForTimeout(4000);
    console.log(`[YoFan Post] SUCCESS! Post published to YoFan.`);
    return true;
  }

  return false;
}

/**
 * Main Runner Function
 */
async function startAutomation(totalPosts = 5) {
  console.log(`\n======================================================`);
  console.log(`  YoFan + Gemini AI Auto-Posting Bot Running Locally  `);
  console.log(`======================================================\n`);

  const browserPath = getBrowserExecutablePath();
  
  // Launch Playwright with Brave/Chrome executable
  const browser = await chromium.launch({
    executablePath: browserPath,
    headless: false, // Visual mode (set true for hidden background execution)
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();

  try {
    // 1. Log in to YoFan
    await loginYoFan(page);

    // 2. Loop to create & publish requested number of posts
    for (let i = 1; i <= totalPosts; i++) {
      console.log(`\n------------------------------------------------------`);
      console.log(`  Executing Post ${i} of ${totalPosts}`);
      console.log(`------------------------------------------------------`);

      const niche = NICHES[Math.floor(Math.random() * NICHES.length)];
      
      // Step A: Generate Title & 500-word Content via Gemini AI
      const aiData = await generateGeminiContent(niche);

      // Step B: Generate HD Image & Save locally to PC
      let localImagePath = null;
      try {
        localImagePath = await generateAndSaveImage(aiData.imagePrompt);

        // Step C: Upload to YoFan
        const success = await uploadToYoFan(page, localImagePath, aiData.title, aiData.content);

        // Step D: Delete local image after successful upload
        if (success && localImagePath) {
          deleteLocalImage(localImagePath);
        }
      } catch (err) {
        console.error(`[Post ${i} Error] ${err.message}`);
        if (localImagePath) {
          deleteLocalImage(localImagePath); // Ensure cleanup on failure as well
        }
      }

      if (i < totalPosts) {
        console.log(`[Scheduler] Waiting 20 seconds before generating next post...`);
        await page.waitForTimeout(20000);
      }
    }

    console.log(`\n🎉 Completed all ${totalPosts} automated posts successfully!`);
  } catch (mainErr) {
    console.error(`[Fatal Bot Error] ${mainErr.message}`);
  } finally {
    await browser.close();
  }
}

// Run bot for 5 posts
startAutomation(5);
