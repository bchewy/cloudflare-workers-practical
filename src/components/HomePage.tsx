export function HomePage() {
  return (
    <div class="container">
      <header>
        <h1>⚡ Edge Shortener</h1>
        <p class="subtitle">Lightning-fast URL shortening at the edge</p>
      </header>

      <main>
        <form id="shorten-form" class="shorten-form">
          <div class="input-group">
            <input 
              type="url" 
              name="url" 
              id="url-input"
              placeholder="Paste your long URL here..."
              required
              autocomplete="off"
            />
            <button type="submit" id="submit-btn">
              <span class="btn-text">Shorten</span>
              <span class="btn-loading" style="display: none;">...</span>
            </button>
          </div>
        </form>

        <div id="result" class="result" style="display: none;">
          <div class="result-header">
            <span class="success-icon">✓</span>
            <span>Link created!</span>
          </div>
          <div class="result-links">
            <div class="link-row">
              <label>Short URL</label>
              <div class="link-copy">
                <input type="text" id="short-url" readonly />
                <button type="button" class="copy-btn" data-target="short-url">Copy</button>
              </div>
            </div>
            <div class="link-row">
              <label>Analytics</label>
              <a id="stats-url" href="#" target="_blank" class="stats-link">View Stats →</a>
            </div>
          </div>
        </div>

        <div id="error" class="error" style="display: none;"></div>
      </main>

      <footer>
        <p>Powered by Cloudflare Workers + KV</p>
        <p class="geo-info">Your request was served from the edge ⚡</p>
      </footer>

      <script dangerouslySetInnerHTML={{ __html: `
        const form = document.getElementById('shorten-form');
        const urlInput = document.getElementById('url-input');
        const submitBtn = document.getElementById('submit-btn');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');
        const result = document.getElementById('result');
        const error = document.getElementById('error');
        const shortUrlInput = document.getElementById('short-url');
        const statsUrl = document.getElementById('stats-url');

        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          
          // Loading state
          btnText.style.display = 'none';
          btnLoading.style.display = 'inline';
          submitBtn.disabled = true;
          result.style.display = 'none';
          error.style.display = 'none';

          try {
            const formData = new FormData();
            formData.append('url', urlInput.value);

            const res = await fetch('/shorten', {
              method: 'POST',
              body: formData
            });

            const data = await res.json();

            if (!res.ok) {
              throw new Error(data.error || 'Failed to shorten URL');
            }

            shortUrlInput.value = data.shortUrl;
            statsUrl.href = data.statsUrl;
            result.style.display = 'block';
            urlInput.value = '';
          } catch (err) {
            error.textContent = err.message;
            error.style.display = 'block';
          } finally {
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
            submitBtn.disabled = false;
          }
        });

        // Copy functionality
        document.querySelectorAll('.copy-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            const input = document.getElementById(targetId);
            navigator.clipboard.writeText(input.value);
            const originalText = btn.textContent;
            btn.textContent = 'Copied!';
            btn.classList.add('copied');
            setTimeout(() => {
              btn.textContent = originalText;
              btn.classList.remove('copied');
            }, 2000);
          });
        });
      `}} />
    </div>
  )
}

