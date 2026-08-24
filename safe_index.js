require('dotenv').config({ path: '../FINAL WITH EXTRACTOR/FINAL WITH EXTRACTOR/.env' });
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function fetchImageAndSaveLocally(keyword) {
    try {
        const url = "https://source.unsplash.com/800x800/?" + encodeURIComponent(keyword);
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        const filePath = path.join(__dirname, 'temp_' + Date.now() + '.jpg');
        fs.writeFileSync(filePath, Buffer.from(buffer));
        return filePath;
    } catch (e) {
        return null;
    }
}

async function uploadToYoFan(page, imagePath, username) {
  console.log(`[YoFan Post] Going to user profile (/${username}) to trigger upload...`);
  await page.goto(`https://yo.fan/${username}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);
  
  console.log("[YoFan Post] Clicking '+' Button...");
  const plusBtn = page.locator('.profile-action__add, div.circle.profile-action__add, app-icon[name="plus"]').first();
  if(await plusBtn.isVisible().catch(()=>false)) {
      await plusBtn.click();
      await page.waitForTimeout(3000);
  } else {
      console.error("[YoFan Post] Could not find '+' button. Skipping this post.");
      return false;
  }

  console.log("[YoFan Post] Clicking 'New post'...");
  const newPostItem = page.locator('app-create-post-link-modal-v2 .action, text="New post"').first();
  if (await newPostItem.isVisible().catch(()=>false)) {
      await newPostItem.click();
      await page.waitForTimeout(5000); 
  } else {
      console.error("[YoFan Post] 'New post' option not found.");
      return false;
  }

  console.log("[YoFan Post] Injecting image file...");
  try {
      const fileInputs = await page.locator('input[type="file"]').all();
      if (fileInputs.length > 0) {
          await fileInputs[fileInputs.length - 1].setInputFiles(imagePath);
          console.log("[YoFan Post] Image injected successfully!");
      } else {
          console.error("[YoFan Post] No file inputs found in DOM.");
          return false;
      }
      await page.waitForTimeout(5000); 
      
      console.log("[YoFan Post] Confirming Crop...");
      const checkmark = page.locator('app-icon[name="check"], .icon-check, .submit-block').first();
      if(await checkmark.isVisible().catch(()=>false)) await checkmark.click();
      await page.waitForTimeout(4000);
      
      console.log("[YoFan Post] Publishing immediately (Skipping Title/Description)...");
      const publishBtn = page.locator('button:has-text("Publish"), .publish-btn, a:has-text("Publish")').first();
      if(await publishBtn.isVisible().catch(()=>false)) {
          await publishBtn.click();
          await page.waitForTimeout(5000);
          console.log("[YoFan Post] SUCCESS! Post published.");
          return true;
      } else {
          console.error("[YoFan Post] Publish button not found.");
          return false;
      }
  } catch(e) {
      console.error("[YoFan Post] Upload failed: " + e.message);
      return false;
  }
}

async function startBot() {
  console.log("======================================================");
  console.log("  YoFan Auto-Posting Bot (ULTRA FAST + AUTH CHECKER) ");
  console.log("======================================================");

  const browser = await chromium.launch({ 
      executablePath: 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe', 
      headless: false,
      args: ['--disable-blink-features=AutomationControlled']
  });

  const authFile = path.join(__dirname, 'auth.json');
  let contextOptions = { viewport: { width: 1280, height: 800 } };
  
  if (fs.existsSync(authFile)) {
      contextOptions.storageState = authFile;
  }

  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();

  console.log("[Auth] Checking login state...");
  await page.goto('https://yo.fan/');
  await page.waitForTimeout(5000);

  let username = null;
  
  // Wait indefinitely until logged in
  while (true) {
      // Find the profile username by looking at navigation links
      const links = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('a')).map(a => a.getAttribute('href'));
      });
      
      // Look for a link like /shivammmaurya that is NOT generic
      const possibleUsernames = links.filter(l => l && l.startsWith('/') && l.length > 2 && !['/login', '/signup', '/discover', '/about', '/terms', '/privacy', '/creator', '/privacy-policy', '/contact', '/dmca'].includes(l));
      
      if (possibleUsernames.length > 0) {
          username = possibleUsernames[0].replace('/', '');
          console.log("[Auth] Successfully logged in! Detected username:", username);
          await context.storageState({ path: authFile });
          break;
      }

      console.log("⚠️ WAITING FOR MANUAL LOGIN IN BROWSER! Please login to YoFan...");
      await page.waitForTimeout(5000);
  }

  const totalPosts = 5;
  for (let i = 1; i <= totalPosts; i++) {
      console.log(`\n--- Executing Post ${i} of ${totalPosts} ---`);
      const keywords = ["Financial Freedom", "Tech Innovations", "Minimalism", "Modern Architecture", "Travel Destinations", "Healthy Lifestyle", "Electric Vehicles", "Artificial Intelligence", "Digital Nomad", "Space Exploration"];
      const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];

      const localImagePath = await fetchImageAndSaveLocally(randomKeyword);
      if (!localImagePath) continue;

      const success = await uploadToYoFan(page, localImagePath, username);
      if (success) {
          try {
              fs.unlinkSync(localImagePath);
          } catch(e) {}
      }

      if (i < totalPosts) {
          console.log("[Scheduler] Waiting 15 seconds before next post...");
          await page.waitForTimeout(15000);
      }
  }

  console.log("\n🎉 Completed all " + totalPosts + " automated posts!");
  await browser.close();
}

startBot();
