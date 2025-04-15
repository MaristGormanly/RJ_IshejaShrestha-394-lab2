const functions = require('firebase-functions');
const axios = require('axios');
const cheerio = require('cheerio');
const { OpenAI } = require('openai');

// Helper function for exponential backoff
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// List of free proxies (you might want to use a paid proxy service for production)
const proxies = [
  'http://45.77.56.113:3128',
  'http://45.77.56.113:8080',
  'http://45.77.56.113:80'
];

// Get a random proxy
const getRandomProxy = () => {
  return proxies[Math.floor(Math.random() * proxies.length)];
};

// Retry function with exponential backoff and proxy rotation
const retryWithBackoff = async (fn, maxRetries = 5, initialDelay = 2000) => {
  let retries = 0;
  let delay = initialDelay;
  let currentProxy = getRandomProxy();

  while (retries < maxRetries) {
    try {
      return await fn(currentProxy);
    } catch (error) {
      if (error.response && (error.response.status === 429 || error.response.status === 403)) {
        retries++;
        if (retries === maxRetries) {
          throw new Error(`Rate limited after ${maxRetries} retries with different proxies`);
        }
        // Switch proxy on each retry
        currentProxy = getRandomProxy();
        await sleep(delay);
        delay *= 2; // Exponential backoff
      } else {
        throw error;
      }
    }
  }
};

exports.scrapeJob = functions.https.onCall(async (data, context) => {
  try {
    // Initialize OpenAI inside the function
    const openai = new OpenAI({
      apiKey: functions.config().openai.api_key,
    });

    const { url } = data;
    
    // More realistic browser headers with random variations
    const getRandomHeaders = () => {
      const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
      ];
      
      return {
        'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0',
        'Referer': 'https://www.google.com/',
        'DNT': '1'
      };
    };
    
    // Fetch the webpage content with retry logic and proxy rotation
    const response = await retryWithBackoff(async (proxy) => {
      const headers = getRandomHeaders();
      return await axios.get(url, { 
        headers,
        proxy: {
          host: proxy.split(':')[1].replace('//', ''),
          port: parseInt(proxy.split(':')[2]),
          protocol: proxy.split(':')[0]
        },
        timeout: 10000, // 10 second timeout
        maxRedirects: 5
      });
    });
    
    const html = response.data;
    const $ = cheerio.load(html);
    
    // Extract basic information with more robust selectors
    const title = $('h1').first().text().trim() || 
                 $('.job-title').first().text().trim() || 
                 $('title').first().text().trim();
    
    const company = $('.company-name').first().text().trim() || 
                   $('.employer').first().text().trim() || 
                   $('.company').first().text().trim();
    
    const location = $('.location').first().text().trim() || 
                    $('.job-location').first().text().trim() || 
                    $('.address').first().text().trim();
    
    // Get the main content
    const content = $('body').text().trim();
    
    // Use OpenAI to extract structured information
    const prompt = `
    Extract the following information from this job posting:
    - Job Title
    - Company Name
    - Location
    - Job Description
    - Requirements
    - Salary Range (if available)
    - Benefits (if available)
    
    Job Posting Content:
    ${content}
    `;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a job information extractor. Extract relevant information from job postings in a structured format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
    });
    
    const extractedInfo = completion.choices[0].message.content;
    
    return {
      success: true,
      data: {
        url,
        title,
        company,
        location,
        extractedInfo,
        rawContent: content
      }
    };
    
  } catch (error) {
    console.error('Error scraping job:', error);
    
    // More specific error messages
    if (error.response) {
      if (error.response.status === 429) {
        return {
          success: false,
          error: 'The website is rate limiting our requests. Please try again in a few minutes or try a different job posting URL.'
        };
      } else if (error.response.status === 403) {
        return {
          success: false,
          error: 'Access to this website is forbidden. The website may be blocking automated requests. Please try a different job posting URL.'
        };
      }
    }
    
    return {
      success: false,
      error: error.message || 'An unknown error occurred while scraping the job posting. Please try again or use a different URL.'
    };
  }
}); 