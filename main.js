document.addEventListener('DOMContentLoaded', () => {
  const urlInput = document.getElementById('youtube-url');
  const downloadBtn = document.getElementById('download-btn');
  const statusMsg = document.getElementById('status');
  
  // Modal Elements
  const modalOverlay = document.getElementById('modal-overlay');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalThumbnail = document.getElementById('modal-thumbnail');
  const modalTitle = document.getElementById('modal-title');
  const modalDownloadList = document.getElementById('modal-download-list');

  const mockData = {
    title: "Awesome YouTube Video Content - 4K Visual Experience",
    thumbnail: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=1000",
    options: [
      { quality: "1080p", details: "60fps - 150MB", ext: "MP4" },
      { quality: "720p", details: "30fps - 80MB", ext: "MP4" },
      { quality: "480p", details: "30fps - 45MB", ext: "MP4" },
      { quality: "MP3", details: "320kbps - 12MB", ext: "Audio" }
    ]
  };

  const isValidYoutubeUrl = (url) => {
    const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
    return pattern.test(url);
  };

  const showModal = (data) => {
    modalThumbnail.src = data.thumbnail;
    modalTitle.textContent = data.title;
    
    modalDownloadList.innerHTML = data.options.map(opt => `
      <div class="download-item">
        <div class="item-info">
          <span class="item-quality">${opt.quality}</span>
          <span class="item-details">${opt.details}</span>
        </div>
        <button class="btn-item-download">Download</button>
      </div>
    `).join('');

    modalOverlay.classList.add('active');
  };

  const closeModal = () => {
    modalOverlay.classList.remove('active');
  };

  const handleDownload = () => {
    const url = urlInput.value.trim();
    
    if (!url) {
      showStatus('Please enter a YouTube URL.', 'error');
      return;
    }

    if (!isValidYoutubeUrl(url)) {
      showStatus('Invalid YouTube URL. Please check again.', 'error');
      return;
    }

    showStatus('Analyzing video content...', 'loading');
    downloadBtn.disabled = true;

    // Simulate network delay
    setTimeout(() => {
      showStatus('', '');
      downloadBtn.disabled = false;
      showModal(mockData);
    }, 1500);
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
    } else if (type === 'success') {
      statusMsg.style.color = '#44ff44';
    } else {
      statusMsg.style.color = 'var(--text-sub)';
    }
  };

  // Event Listeners
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

  // Handle ESC key to close modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
      closeModal();
    }
  });
});
