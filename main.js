document.addEventListener('DOMContentLoaded', () => {
  const urlInput = document.getElementById('youtube-url');
  const downloadBtn = document.getElementById('download-btn');
  const statusMsg = document.getElementById('status');
  
  const modalOverlay = document.getElementById('modal-overlay');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalThumbnail = document.getElementById('modal-thumbnail');
  const modalTitle = document.getElementById('modal-title');
  const modalDownloadList = document.getElementById('modal-download-list');

  // 1순위: Cobalt API (가장 강력함)
  // 2순위: Piped API (백업)
  const PROVIDERS = [
    {
      name: "Cobalt Engine",
      type: "POST",
      url: "https://api.cobalt.tools/api/json",
      headers: { "Accept": "application/json", "Content-Type": "application/json" }
    },
    {
      name: "Piped Instance 1",
      type: "GET",
      url: "https://pipedapi.kavin.rocks/streams/"
    },
    {
      name: "Piped Instance 2",
      type: "GET",
      url: "https://piped-api.lunar.icu/streams/"
    }
  ];

  const extractVideoId = (url) => {
    if (!url) return null;
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const showModal = (data) => {
    modalThumbnail.src = data.thumbnail || `https://i.ytimg.com/vi/${data.id}/maxresdefault.jpg`;
    modalTitle.textContent = data.title || "YouTube Video";
    
    if (data.streams && data.streams.length > 0) {
      modalDownloadList.innerHTML = data.streams.map(stream => `
        <div class="download-item">
          <div class="item-info">
            <span class="item-quality">${stream.quality}</span>
            <span class="item-details">${stream.format} • ${stream.size || 'Direct Link'}</span>
          </div>
          <button class="btn-item-download" onclick="window.open('${stream.url}', '_blank')">Download</button>
        </div>
      `).join('');
    } else {
      modalDownloadList.innerHTML = '<p class="status-msg visible" style="color: #ff4444; opacity: 1;">No downloadable streams found. Try another link.</p>';
    }

    modalOverlay.classList.add('active');
  };

  const handleDownload = async () => {
    const url = urlInput.value.trim();
    const videoId = extractVideoId(url);
    
    if (!url || !videoId) {
      showStatus('Please enter a valid YouTube URL.', 'error');
      return;
    }

    showStatus('Initializing high-speed analysis...', 'loading');
    downloadBtn.disabled = true;
    downloadBtn.innerHTML = '<span>Processing...</span>';

    let success = false;

    for (const provider of PROVIDERS) {
      try {
        console.log(`Trying ${provider.name}...`);
        showStatus(`Connecting to ${provider.name}...`, 'loading');

        let response;
        if (provider.type === "POST") {
          response = await fetch(provider.url, {
            method: "POST",
            headers: provider.headers,
            body: JSON.stringify({ url: url, videoQuality: "1080" })
          });
        } else {
          response = await fetch(`${provider.url}${videoId}`);
        }

        if (!response.ok) throw new Error("Server response error");

        const result = await response.json();
        
        // 데이터 정규화 (Cobalt와 Piped 형식이 다름)
        let normalizedData = {};
        if (provider.name === "Cobalt Engine") {
          if (result.status === "error") throw new Error(result.text);
          normalizedData = {
            id: videoId,
            title: "Result from Cobalt",
            thumbnail: "",
            streams: [{ quality: "Best Quality", format: "MP4", url: result.url, size: "High-speed" }]
          };
        } else {
          normalizedData = {
            id: videoId,
            title: result.title,
            thumbnail: result.thumbnailUrl,
            streams: result.videoStreams.filter(s => !s.videoOnly).map(s => ({
              quality: s.quality,
              format: s.mimeType.split(';')[0].split('/')[1].toUpperCase(),
              url: s.url
            }))
          };
        }

        showStatus('', '');
        showModal(normalizedData);
        success = true;
        break;
      } catch (error) {
        console.warn(`${provider.name} failed:`, error.message);
        continue;
      }
    }

    if (!success) {
      showStatus('All extraction methods failed. The video might be restricted or servers are down.', 'error');
    }

    downloadBtn.disabled = false;
    downloadBtn.innerHTML = '<span>Download</span>';
  };

  const showStatus = (text, type) => {
    if (!text) {
      statusMsg.classList.remove('visible');
      return;
    }
    statusMsg.textContent = text;
    statusMsg.className = `status-msg visible ${type}`;
    statusMsg.style.color = type === 'error' ? '#ff4444' : 'var(--text-sub)';
  };

  downloadBtn.addEventListener('click', handleDownload);
  urlInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleDownload(); });
  modalCloseBtn.addEventListener('click', () => modalOverlay.classList.remove('active'));
  modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) modalOverlay.classList.remove('active'); });
});
