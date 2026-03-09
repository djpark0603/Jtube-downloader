document.addEventListener('DOMContentLoaded', () => {
  const urlInput = document.getElementById('youtube-url');
  const downloadBtn = document.getElementById('download-btn');
  const statusMsg = document.getElementById('status');
  
  const modalOverlay = document.getElementById('modal-overlay');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalThumbnail = document.getElementById('modal-thumbnail');
  const modalTitle = document.getElementById('modal-title');
  const modalDownloadList = document.getElementById('modal-download-list');

  // 다중 인스턴스 설정 (하나가 안 되면 다른 곳 시도)
  const API_INSTANCES = [
    "https://pipedapi.kavin.rocks",
    "https://api.piped.victr.me",
    "https://piped-api.garudalinux.org"
  ];

  const extractVideoId = (url) => {
    if (!url) return null;
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const showModal = (data) => {
    modalThumbnail.src = data.thumbnailUrl || data.thumbnail;
    modalTitle.textContent = data.title;
    
    // 오디오와 비디오가 합쳐진 스트림 필터링
    const streams = data.videoStreams ? data.videoStreams.filter(s => s.videoOnly === false) : [];
    
    if (streams.length === 0) {
      modalDownloadList.innerHTML = '<p class="status-msg visible" style="color: #ff4444; opacity: 1;">Direct links not available for this video.</p>';
    } else {
      modalDownloadList.innerHTML = streams.map(stream => `
        <div class="download-item">
          <div class="item-info">
            <span class="item-quality">${stream.quality}</span>
            <span class="item-details">${stream.mimeType.split(';')[0].split('/')[1].toUpperCase()} • ${stream.fps}fps</span>
          </div>
          <button class="btn-item-download" onclick="window.open('${stream.url}', '_blank')">Download</button>
        </div>
      `).join('');
    }

    modalOverlay.classList.add('active');
  };

  const closeModal = () => {
    modalOverlay.classList.remove('active');
  };

  const handleDownload = async () => {
    const url = urlInput.value.trim();
    const videoId = extractVideoId(url);
    
    if (!url) {
      showStatus('Please enter a YouTube URL.', 'error');
      return;
    }

    if (!videoId) {
      showStatus('Could not find a valid Video ID. Please check the URL.', 'error');
      return;
    }

    showStatus('Analyzing video...', 'loading');
    downloadBtn.disabled = true;
    const originalBtnText = downloadBtn.innerHTML;
    downloadBtn.innerHTML = '<span>Analyzing...</span>';

    let success = false;

    // 여러 인스턴스를 순차적으로 시도
    for (const apiBase of API_INSTANCES) {
      try {
        console.log(`Trying API: ${apiBase} for ID: ${videoId}`);
        const response = await fetch(`${apiBase}/streams/${videoId}`);
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        if (data && data.title) {
          showStatus('', '');
          showModal(data);
          success = true;
          break; // 성공하면 루프 중단
        }
      } catch (error) {
        console.warn(`Failed with ${apiBase}:`, error.message);
        continue; // 다음 인스턴스 시도
      }
    }

    if (!success) {
      showStatus('Server is busy or video restricted. Please try again later.', 'error');
    }

    downloadBtn.disabled = false;
    downloadBtn.innerHTML = originalBtnText;
  };

  const showStatus = (text, type) => {
    if (!text) {
      statusMsg.classList.remove('visible');
      return;
    }
    statusMsg.textContent = text;
    statusMsg.className = `status-msg visible ${type}`;
    
    if (type === 'error') {
      statusMsg.style.color = '#ff4444';
    } else {
      statusMsg.style.color = 'var(--text-sub)';
    }
  };

  downloadBtn.addEventListener('click', handleDownload);
  
  urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleDownload();
  });

  urlInput.addEventListener('input', () => {
    statusMsg.classList.remove('visible');
  });

  modalCloseBtn.addEventListener('click', closeModal);
  
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
      closeModal();
    }
  });
});
