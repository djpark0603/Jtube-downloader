document.addEventListener('DOMContentLoaded', () => {
  const urlInput = document.getElementById('youtube-url');
  const downloadBtn = document.getElementById('download-btn');
  const statusMsg = document.getElementById('status');

  const isValidYoutubeUrl = (url) => {
    const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
    return pattern.test(url);
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
    
    // Simulate processing
    downloadBtn.disabled = true;
    downloadBtn.style.opacity = '0.5';

    setTimeout(() => {
      showStatus('Feature coming soon! UI is ready.', 'success');
      downloadBtn.disabled = false;
      downloadBtn.style.opacity = '1';
    }, 2000);
  };

  const showStatus = (text, type) => {
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

  downloadBtn.addEventListener('click', handleDownload);
  
  urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleDownload();
    }
  });

  // Clear status when typing
  urlInput.addEventListener('input', () => {
    statusMsg.classList.remove('visible');
  });
});
