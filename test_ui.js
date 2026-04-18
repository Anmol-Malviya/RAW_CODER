import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

(async () => {
  console.log('🚀 Launching Puppeteer...');
  const browser = await puppeteer.launch({
    headless: 'new', // Use the new headless mode
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--window-size=1280,800',
      '--no-sandbox',
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  try {
    console.log('➡️ Navigating to the app (http://localhost:5174)...');
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle0' });

    console.log('➡️ Trying to log in as admin...');
    const bodyText = await page.evaluate(() => document.body.innerText);

    if (bodyText.includes('Sign in to VyorAI')) {
      // It is asking for login. Let's switch to Registration to create a fresh user
      console.log('➡️ Switching to Create Account...');
      // Click the "Create account" toggle button at the bottom
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const createBtn = buttons.find(b => b.innerText.includes('Create account'));
        if(createBtn) createBtn.click();
      });

      await new Promise(r => setTimeout(r, 1000));

      console.log('➡️ Filling Admin Registration...');
      // Select candidate / admin toggle. There are two RoleButton components. 
      // Evaluate to find the one saying "Recruiter"
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const recruiterBtn = buttons.find(b => b.innerText.includes('Recruiter'));
        if(recruiterBtn) recruiterBtn.click();
      });

      // Fill form. The inputs are [text, email, password]
      const inputs = await page.$$('input.input-soft');
      if(inputs.length >= 3) {
        await inputs[0].type('Test Admin');
        await inputs[1].type(`admin_${Date.now()}@test.com`);
        await inputs[2].type('password123');
      }

      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const submitBtn = buttons.find(b => b.innerText === 'Create account');
        if(submitBtn) submitBtn.click();
      });

      await page.waitForNavigation({ waitUntil: 'networkidle0' });
    }

    // Now we should be on /admin
    console.log('✅ Reached dashboard! Taking screenshot...');
    await page.screenshot({ path: 'admin_dashboard.png' });

    console.log('➡️ Clicking "Post new role"...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const postBtn = buttons.find(b => b.innerText.includes('Post new role'));
      if(postBtn) postBtn.click();
    });

    await new Promise(r => setTimeout(r, 1000));
    console.log('➡️ Filling new job details...');
    
    // Fill job modal
    const modalInputs = await page.$$('.input-soft');
    if (modalInputs.length >= 1) {
      await modalInputs[0].type('Puppeteer Tester');
    }
    
    const textareas = await page.$$('textarea');
    if (textareas.length >= 1) {
      await textareas[0].type('Test the application visually.');
    }

    // Toggle coding round
    await page.evaluate(() => {
      const checkbox = document.querySelector('input[type="checkbox"]');
      if (checkbox) checkbox.click();
      
      const buttons = Array.from(document.querySelectorAll('button'));
      const createBtn = buttons.find(b => b.innerText === 'Create role');
      if(createBtn) createBtn.click();
    });

    await new Promise(r => setTimeout(r, 2000));
    console.log('✅ Job created! Taking screenshot...');
    await page.screenshot({ path: 'admin_job_created.png' });

    console.log('🎉 Basic UI Flow Verified Locally through Puppeteer.');

  } catch (err) {
    console.error('❌ E2E Failed:', err);
    await page.screenshot({ path: 'error_state.png' });
  } finally {
    await browser.close();
  }
})();
