document.addEventListener('DOMContentLoaded', () => {
  const RAPID_API_KEY = '7591007062msh40e97395d00fb9ep16478ajsn9f09d4ffe5d3'; 
  const RAPID_API_HOST = 'youtube-media-downloader.p.rapidapi.com';

  const urlInput = document.getElementById('youtube-url');
  const downloadBtn = document.getElementById('download-btn');
  const statusMsg = document.getElementById('status');
  
  const modalOverlay = document.getElementById('modal-overlay');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalThumbnail = document.getElementById('modal-thumbnail');
  const modalTitle = document.getElementById('modal-title');
  const modalDownloadList = document.getElementById('modal-download-list');

  const extractVideoId = (url) => {
    if (!url) return null;
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (typeof bytes === 'string') {
      if (bytes.includes('B')) return bytes;
      bytes = parseInt(bytes.replace(/[^0-9]/g, ''));
    }
    if (isNaN(bytes) || bytes === 0) return '';
    const mb = bytes / (1024 * 1024);
    return mb.toFixed(1) + 'MB';
  };

  const showModal = (data) => {
    const thumbUrl = data.thumbnails && data.thumbnails.length > 0 
      ? data.thumbnails[data.thumbnails.length - 1].url 
      : `https://i.ytimg.com/vi/${data.id}/maxresdefault.jpg`;
    
    modalThumbnail.src = thumbUrl;
    modalTitle.textContent = data.title || "분석된 동영상";
    
    // [핵심] 모든 객체 트리를 뒤져서 스트림 정보를 찾는 함수
    const extractStreams = (obj) => {
      let found = [];
      const search = (item) => {
        if (!item || typeof item !== 'object') return;
        
        // 직접적인 URL을 가진 객체인 경우
        if (item.url && typeof item.url === 'string' && item.url.startsWith('http')) {
          found.push(item);
        } else if (item.link && typeof item.link === 'string' && item.link.startsWith('http')) {
          found.push({ ...item, url: item.link });
        }
        
        // 자식 요소 탐색
        Object.values(item).forEach(val => {
          if (Array.isArray(val)) val.forEach(search);
          else if (val && typeof val === 'object') search(val);
        });
      };
      search(obj);
      return found;
    };

    const allFormats = extractStreams(data);
    const uniqueFormats = [];
    const seenQualities = new Set();

    // 화질 순 정렬
    allFormats.sort((a, b) => {
      const getQ = (f) => parseInt((f.qualityLabel || f.quality || f.height || f.label || '0').toString().replace(/[^0-9]/g, '')) || 0;
      return getQ(b) - getQ(a);
    });

    allFormats.forEach(f => {
      let qualityStr = (f.qualityLabel || f.quality || f.label || (f.height ? f.height + 'p' : '')).toString().toUpperCase();
      if (!qualityStr || qualityStr === 'UNDEFINED') qualityStr = 'HD';
      
      // 화질 숫자 추출 (예: "720P" -> 720)
      const qualityNum = parseInt(qualityStr.replace(/[^0-9]/g, '')) || 0;
      
      // 오디오 전용이 아니고, 화질 숫자가 240 미만이면 제외 (단, 0인 경우는 텍스트 화질이므로 일단 포함)
      const isAudio = (f.mimeType && f.mimeType.includes('audio')) || (f._key && f._key.toLowerCase().includes('mp3'));
      if (!isAudio && qualityNum > 0 && qualityNum < 240) {
        return; // 240p 미만 저화질 필터링
      }

      const type = isAudio ? 'AUDIO' : 'VIDEO';
      const key = `${qualityStr}-${type}`;

      if (seenQualities.has(key)) return;

      const downloadUrl = f.url || f.link;
      if (!downloadUrl) return;

      let ext = (f.mimeType ? f.mimeType.split(';')[0].split('/')[1] : (f.ext || f.format || 'MP4')).toUpperCase();
      if (ext.includes('MP4')) ext = 'MP4';

      const size = formatSize(f.contentLength || f.size || f.filesize);
      if (!size) return; // 용량 정보가 없으면 리스트에서 제외

      uniqueFormats.push({
        url: downloadUrl,
        label: `${qualityStr.toLowerCase()} (${ext}) - ${size}`
      });
      seenQualities.add(key);
      });


    if (uniqueFormats.length > 0) {
      modalDownloadList.innerHTML = uniqueFormats.map(f => `
        <div class="download-item">
          <div class="item-info">
            <span class="item-main-text">${f.label}</span>
          </div>
          <button class="btn-item-download" onclick="window.open('${f.url}', '_blank')">Download</button>
        </div>
      `).join('');
    } else {
      modalDownloadList.innerHTML = `
        <div style="padding: 20px; color: #ff4444;">
          <p>분석된 다운로드 링크가 없습니다.</p>
          <p style="font-size: 0.8rem; color: #888; margin-top: 10px;">동영상이 비공개이거나 추출이 제한된 형식입니다.</p>
        </div>
      `;
    }

    modalOverlay.classList.add('active');
  };

  const handleDownload = async () => {
    const url = urlInput.value.trim();
    const videoId = extractVideoId(url);
    
    if (!url || !videoId) {
      showStatus('유효한 유튜브 주소를 입력해주세요.', 'error');
      return;
    }

    showStatus('동영상을 정밀 분석 중입니다...', 'loading');
    downloadBtn.disabled = true;
    downloadBtn.innerHTML = '<span>Analyzing...</span>';

    try {
      const response = await fetch(`https://${RAPID_API_HOST}/v2/video/details?videoId=${videoId}`, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': RAPID_API_KEY,
          'x-rapidapi-host': RAPID_API_HOST
        }
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      
      if (result.status === false) throw new Error(result.msg || '분석 실패');

      showStatus('', '');
      showModal({ id: videoId, ...result });

    } catch (error) {
      console.error('Download Error:', error);
      statusMsg.textContent = `분석 실패: ${error.message}`;
      statusMsg.className = 'status-msg visible error';
    } finally {
      downloadBtn.disabled = false;
      downloadBtn.innerHTML = '<span>Download</span>';
    }
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
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') modalOverlay.classList.remove('active'); });
});
