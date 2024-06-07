const express = require('express');
const axios = require('axios');
const path = require('path');
const fs = require('fs-extra');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/search-pinterest', async (req, res) => {
  try {
    const { query, number } = req.body;

    if (!query || !number || isNaN(number) || number < 1 || number > 99) {
      return res.send(`
        <p>⛔ Invalid Input</p>
        <p>Please enter a valid search query and number of images (1-99).</p>
        <a href="/" class="back-button">Back</a>
        <footer>
          <p>© 2024 Herudev. All rights reserved</p>
        </footer>
      `);
    }

    const apiUrl = `https://itsaryan.onrender.com/api/pinterest?query=${encodeURIComponent(query)}&limits=${number}`;
    console.log(`Fetching data from API: ${apiUrl}`);
    
    const response = await axios.get(apiUrl);
    const data = response.data;

    if (!data || data.length === 0) {
      return res.send(`
        <p>No results found for your query "${query}". Please try with a different query.</p>
        <a href="/" class="back-button">Back</a>
        <footer>
          <p>© 2024 Herudev. All rights reserved</p>
        </footer>
      `);
    }

    const imgData = [];
    const cacheDir = path.join(__dirname, 'cache');

    await fs.ensureDir(cacheDir);

    for (let i = 0; i < Math.min(number, data.length); i++) {
      console.log(`Fetching image ${i + 1} from URL: ${data[i]}`);
      const imgResponse = await axios.get(data[i], { responseType: 'arraybuffer' });
      const imgPath = path.join(cacheDir, `${i + 1}.jpg`);
      await fs.outputFile(imgPath, imgResponse.data);
      imgData.push(`
        <a href="${data[i]}" target="_blank">
          <img src="/cache/${i + 1}.jpg" alt="Image ${i + 1}">
        </a>
        <br>
        <a href="/cache/${i + 1}.jpg"downloa> Download${i + 1}</a>
      `);
    }

    res.send(`
      <h1>Pinterest Results</h1>
      <center><p>Here are the top ${number} results for your query "${query}":</p></center>
      <div class="image-container">${imgData.join('')}</div>
      <center><a href="/" class="back-button">Back</a></center>
      <footer>
        <p>© 2024 Herudev. All rights reserved</p>
      </footer>
      <style>
        body {
          font-family: Arial, sans-serif;
          background: #f0f4f8;
          margin: 0;
          padding: 0;
        }
      
        h1 {
          text-align: center;
          margin-top: 50px;
          color: #333;
        }
      
        .back-button {
          display: inline-block;
          margin-top: 20px;
          padding: 10px 20px;
          background-color: #007BFF;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          transition: background-color 0.3s;
          text-align: center;
          margin: 20px auto;
          align-items: center;
        }
      
        .back-button:hover {
          background-color: #0056b3;
        }
      
        .image-container {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          margin-top: 20px;
        }
      
        .image-container a {
          margin: 10px;
          text-decoration: none;
          transition: transform 0.3s;
        }
      
        .image-container img {
          width: 200px;
          height: auto;
          border-radius: 10px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
      
        .image-container a:hover {
          transform: scale(1.05);
        }
      
        .image-container a:active {
          transform: scale(0.95);
        }

        footer {
          text-align: center;
          margin-top: 50px;
          color: #777;
          font-size: 0.9em;
        }
      </style>
    `);

    // Clean up the cache directory after a delay
    setTimeout(async () => {
      await fs.remove(cacheDir);
      console.log('Cache directory cleaned up.');
    }, 30000);

  } catch (error) {
    console.error('Error fetching images from Pinterest:', error);
    res.send(`
      <p>An error occurred while fetching images. Please try again later.</p>
      <a href="/" class="back-button">Back</a>
      <footer>
        <p>© 2024 Herudev. All rights reserved</p>
      </footer>
    `);
  }
});

app.use('/cache', express.static(path.join(__dirname, 'cache')));

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
