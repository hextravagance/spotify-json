document.addEventListener('DOMContentLoaded', function () {
  fetch('data.json')
    .then(response => response.json())
    .then(tracks => {
      generateCharts(tracks);
      populateSongsTable(tracks);
      populateSongsCards(tracks);
      setupSearch();
      setupSorting();
      setupModalListener(tracks);
      AlbumPopulaire(tracks);
    })
    .catch(err => {
      console.error('Erreur lors du chargement des données :', err);
    });
});

function getDefaultImage(size) {
  const defaultSize = size || 300;
  const canvas = document.createElement('canvas');
  canvas.width = defaultSize;
  canvas.height = defaultSize;
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = '#e0e0e0';
  ctx.fillRect(0, 0, defaultSize, defaultSize);
  
  ctx.fillStyle = '#9e9e9e';
  ctx.font = (defaultSize/4) + 'px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('♫', defaultSize/2, defaultSize/2);
  
  return canvas.toDataURL('image/png');
}

function generateCharts(tracks) {
  const artistCount = {};
  const genreCount = {};

  tracks.forEach(track => {
    track.artists.forEach(artist => {
      const artistName = artist.name;
      artistCount[artistName] = (artistCount[artistName] || 0) + 1;
    });

    if (track.album?.genres?.length) {
      track.album.genres.forEach(genre => {
        genreCount[genre] = (genreCount[genre] || 0) + 1;
      });
    } else if (track.artists) {
      track.artists.forEach(artist => {
        if (artist.genres?.length) {
          artist.genres.forEach(genre => {
            genreCount[genre] = (genreCount[genre] || 0) + 1;
          });
        }
      });
    }
  });

  let artistArray = Object.entries(artistCount);
  artistArray.sort((a, b) => b[1] - a[1]);
  const topArtists = artistArray.slice(0, 10);

  let genreArray = Object.entries(genreCount);
  genreArray.sort((a, b) => b[1] - a[1]);
  
  if (genreArray.length > 7) {
    const topGenres = genreArray.slice(0, 6);
    const otherGenres = genreArray.slice(6);
    
    const otherCount = otherGenres.reduce((sum, genre) => sum + genre[1], 0);
    
    if (otherCount > 0) {
      topGenres.push(['Autres', otherCount]);
    }
    
    genreArray = topGenres;
  }

  renderArtistsChart(topArtists);
  renderGenresChart(genreArray);
}

function renderArtistsChart(data) {
  const ctx = document.getElementById('artistsChart').getContext('2d');
  
  const labels = data.map(item => item[0]);
  const values = data.map(item => item[1]);
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Nombre de morceaux',
        data: values,
        backgroundColor: '#64B5F6',
        borderColor: '#1E88E5',
        borderWidth: 1
      }]
    },
    options: {
      indexAxis: 'y',
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Top 10 des artistes (nombre de morceaux)',
          font: { size: 16 }
        },
        legend: { display: false }
      },
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

function renderGenresChart(data) {
  const ctx = document.getElementById('genresChart').getContext('2d');
  
  const colors = [
    '#FF9AA2',
    '#74B9FF',
    '#FFD700',
    '#55EDBF',
    '#B19CD9',
    '#FF9966',
    '#A3D39C',
    '#CCCCCC',
  ];
  
  const labels = data.map(item => item[0]);
  const values = data.map(item => item[1]);
  
  new Chart(ctx, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors.slice(0, data.length),
        borderColor: '#fff',
        borderWidth: 1
      }]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: 'Distribution des genres musicaux',
          font: { size: 16 }
        },
        legend: {
          position: 'right',
          labels: {
            boxWidth: 15,
            padding: 10
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.raw || 0;
              
              const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
              const percentage = Math.round((value / total) * 100);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      },
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

function populateSongsTable(tracks) {
  const tbody = document.getElementById('songsTableBody');
  if (!tbody) return;
  
  tbody.innerHTML = '';

  tracks.forEach(track => {
    const row = document.createElement('tr');
    
    const nameCell = document.createElement('td');
    nameCell.textContent = track.name;
    row.appendChild(nameCell);
    
    const artistCell = document.createElement('td');
    const artistNames = track.artists.map(artist => artist.name);
    artistCell.textContent = artistNames.join(', ');
    row.appendChild(artistCell);
    
    const albumCell = document.createElement('td');
    albumCell.textContent = track.album ? track.album.name : '';
    row.appendChild(albumCell);
    
    const actionCell = document.createElement('td');
    actionCell.className = 'text-center';
    
    const detailButton = document.createElement('button');
    detailButton.className = 'btn btn-sm btn-primary details-btn';
    detailButton.setAttribute('data-bs-toggle', 'modal');
    detailButton.setAttribute('data-bs-target', '#songDetailModal');
    detailButton.setAttribute('data-song-id', track.id);
    
    const icon = document.createElement('i');
    icon.className = 'bi bi-info-circle';
    detailButton.appendChild(icon);
    
    const buttonText = document.createTextNode(' Détails');
    detailButton.appendChild(buttonText);
    actionCell.appendChild(detailButton);
    row.appendChild(actionCell);
    
    tbody.appendChild(row);
  });
}

function populateSongsCards(tracks) {
  const container = document.getElementById('songCardContainer');
  if (!container) return;
  
  container.innerHTML = '';

  tracks.forEach(track => {
    const item = document.createElement('div');
    item.className = 'list-group-item p-3 border-bottom';
    item.setAttribute('data-track-id', track.id);
    
    const row = document.createElement('div');
    row.className = 'row g-2';
    
    const titleCol = document.createElement('div');
    titleCol.className = 'col-12';
    const titleRow = document.createElement('div');
    titleRow.className = 'd-flex justify-content-between align-items-center';
    
    const titleLabel = document.createElement('strong');
    titleLabel.textContent = 'Titre';
    
    const titleValue = document.createElement('span');
    titleValue.textContent = track.name;
    
    titleRow.appendChild(titleLabel);
    titleRow.appendChild(titleValue);
    titleCol.appendChild(titleRow);
    row.appendChild(titleCol);
    
    const artistCol = document.createElement('div');
    artistCol.className = 'col-12';
    const artistRow = document.createElement('div');
    artistRow.className = 'd-flex justify-content-between align-items-center';
    
    const artistLabel = document.createElement('strong');
    artistLabel.textContent = 'Artiste';
    
    const artistValue = document.createElement('span');
    const artistNames = track.artists.map(artist => artist.name);
    artistValue.textContent = artistNames.join(', ');
    
    artistRow.appendChild(artistLabel);
    artistRow.appendChild(artistValue);
    artistCol.appendChild(artistRow);
    row.appendChild(artistCol);
    
    const albumCol = document.createElement('div');
    albumCol.className = 'col-12';
    const albumRow = document.createElement('div');
    albumRow.className = 'd-flex justify-content-between align-items-center';
    
    const albumLabel = document.createElement('strong');
    albumLabel.textContent = 'Album';
    
    const albumValue = document.createElement('span');
    albumValue.textContent = track.album ? track.album.name : '';
    
    albumRow.appendChild(albumLabel);
    albumRow.appendChild(albumValue);
    albumCol.appendChild(albumRow);
    row.appendChild(albumCol);
    
    const actionCol = document.createElement('div');
    actionCol.className = 'col-12 mt-2';
    const actionRow = document.createElement('div');
    actionRow.className = 'd-flex justify-content-end';
    
    const detailButton = document.createElement('button');
    detailButton.className = 'btn btn-sm btn-primary details-btn';
    detailButton.setAttribute('data-bs-toggle', 'modal');
    detailButton.setAttribute('data-bs-target', '#songDetailModal');
    detailButton.setAttribute('data-song-id', track.id);
    
    const icon = document.createElement('i');
    icon.className = 'bi bi-info-circle';
    detailButton.appendChild(icon);
    
    const buttonText = document.createTextNode(' Détails');
    detailButton.appendChild(buttonText);
    actionRow.appendChild(detailButton);
    actionCol.appendChild(actionRow);
    row.appendChild(actionCol);
    
    item.appendChild(row);
    container.appendChild(item);
  });
}

function setupModalListener(tracks) {
  const songDetailModal = document.getElementById('songDetailModal');
  
  songDetailModal.addEventListener('show.bs.modal', function (event) {
    const button = event.relatedTarget;
    const songId = button.getAttribute('data-song-id');
    
    const track = tracks.find(t => t.id === songId);
    
    if (track) {
      document.getElementById('modalSongTitle').textContent = track.name;
      document.getElementById('modalSongDuration').textContent = formatDuration(track.duration_ms);
      document.getElementById('modalSongPopularity').textContent = track.popularity || 0;
      document.getElementById('modalTrackNumber').textContent = track.track_number || 1;
      document.getElementById('modalExplicit').textContent = track.explicit ? 'Oui' : 'Non';
      
      if (track.album) {
        let albumImage = '';
        if (track.album.images?.length) {
          albumImage = track.album.images[0].url;
        } else {
          albumImage = getDefaultImage(300);
        }
        const modalAlbumImage = document.getElementById('modalAlbumImage');
        modalAlbumImage.src = albumImage;
        modalAlbumImage.alt = "Album-cover-" + (track.album.name || "").replace(/\s+/g, "-");
        
        document.getElementById('modalReleaseDate').textContent = formatDate(track.album.release_date);
        document.getElementById('modalAlbumPopularity').textContent = 'Popularité: ' + (track.album.popularity || 0) + '/100';
      }
      
      const audioElement = document.getElementById('modalAudioPreview');
      if (track.preview_url) {
        audioElement.src = track.preview_url;
        audioElement.style.display = 'block';
      } else {
        audioElement.style.display = 'none';
      }
      
      const artistsListElement = document.getElementById('modalArtistsList');
      artistsListElement.innerHTML = '<strong>Artistes :</strong>';
      
      const artistsList = document.createElement('ul');
      artistsList.className = 'list-unstyled mt-1';
      
      track.artists.forEach(artist => {
        const artistItem = document.createElement('li');
        artistItem.className = 'd-flex align-items-center mb-2';
        
        const artistImageUrl = artist.images?.length ? artist.images[0].url : getDefaultImage(30);
        
        const artistImg = document.createElement('img');
        artistImg.src = artistImageUrl;
        artistImg.className = 'rounded-circle me-2';
        artistImg.width = 30;
        artistImg.height = 30;
        artistImg.onerror = function() { 
          this.src = getDefaultImage(30); 
        };
        artistItem.appendChild(artistImg);
        
        const artistInfo = document.createElement('div');
        
        const artistName = document.createElement('div');
        artistName.textContent = artist.name;
        artistInfo.appendChild(artistName);
        
        const artistStats = document.createElement('small');
        artistStats.className = 'text-muted';
        artistStats.textContent = 'Popularité: ' + (artist.popularity || 0) + '/100';
        
        if (artist.followers?.total) {
          artistStats.textContent += ' • ' + artist.followers.total + ' followers';
        }
        
        artistInfo.appendChild(artistStats);
        artistItem.appendChild(artistInfo);
        
        artistsList.appendChild(artistItem);
      });
      
      artistsListElement.appendChild(artistsList);
      
      const genresElement = document.getElementById('modalGenres');
      genresElement.innerHTML = '';
      
      const genres = track.album?.genres || [];
      
      if (genres.length > 0) {
        genres.forEach(genre => {
          const badge = document.createElement('span');
          badge.className = 'badge bg-secondary me-1 mb-1';
          badge.textContent = genre;
          genresElement.appendChild(badge);
        });
      } else {
        genresElement.textContent = 'Aucun genre disponible';
      }
      
      const spotifyLink = document.getElementById('modalSpotifyLink');
      if (track.external_urls?.spotify) {
        spotifyLink.href = track.external_urls.spotify;
        spotifyLink.style.display = 'inline-block';
      } else {
        spotifyLink.style.display = 'none';
      }
    }
  });
}

function AlbumPopulaire(tracks) {
  const albums = {};
  
  tracks.forEach(track => {
    if (track.album?.id) {
      if (!albums[track.album.id]) {
        albums[track.album.id] = {
          id: track.album.id,
          name: track.album.name,
          images: track.album.images,
          release_date: track.album.release_date,
          popularity: track.album.popularity || 0,
          trackCount: 0,
          artistNames: []
        };
      }
      
      albums[track.album.id].trackCount++;
      
      track.artists.forEach(artist => {
        const artistName = artist.name;
        if (!albums[track.album.id].artistNames.includes(artistName)) {
          albums[track.album.id].artistNames.push(artistName);
        }
      });
    }
  });
  
  const albumsList = Object.values(albums);
  
  albumsList.sort((a, b) => b.popularity - a.popularity);
  
  const topAlbums = albumsList.slice(0, 12);
  
  const container = document.getElementById('popularAlbums');
  container.innerHTML = '';
  
  topAlbums.forEach(album => {
    const col = document.createElement('div');
    col.className = 'col';
    
    const card = document.createElement('div');
    card.className = 'card h-100 shadow-sm';
    
    const img = document.createElement('img');
    img.className = 'card-img-top';
    img.style.height = '200px';
    img.style.objectFit = 'cover';
    
    if (album.images?.length) {
      img.src = album.images[0].url;
      img.alt = "Album-cover-" + (album.name || "").replace(/\s+/g, "-");
    } else {
      img.src = getDefaultImage(300);
      img.alt = "Album-cover-placeholder";
    }
    card.appendChild(img);
    
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';
    
    const title = document.createElement('h5');
    title.className = 'card-title text-truncate';
    title.textContent = album.name;
    cardBody.appendChild(title);
    
    const artist = document.createElement('p');
    artist.className = 'card-text text-truncate';
    artist.textContent = album.artistNames[0] || '';
    cardBody.appendChild(artist);
    
    const dateP = document.createElement('p');
    dateP.className = 'card-text';
    const dateSmall = document.createElement('small');
    dateSmall.className = 'text-muted';
    
    if (album.release_date) {
      const date = new Date(album.release_date);
      const day = date.getDate();
      const month = date.toLocaleString('fr-FR', { month: 'long' });
      const year = date.getFullYear();
      dateSmall.textContent = day + ' ' + month + ' ' + year;
    }
    
    dateP.appendChild(dateSmall);
    cardBody.appendChild(dateP);
    
    const badges = document.createElement('div');
    badges.className = 'd-flex justify-content-between align-items-center';
    
    const trackBadge = document.createElement('span');
    trackBadge.className = 'badge bg-primary';
    trackBadge.textContent = album.trackCount + ' titres';
    badges.appendChild(trackBadge);
    
    const popBadge = document.createElement('span');
    popBadge.className = 'badge bg-success';
    popBadge.textContent = album.popularity + '/100';
    badges.appendChild(popBadge);
    
    cardBody.appendChild(badges);
    card.appendChild(cardBody);
    col.appendChild(card);
    
    container.appendChild(col);
  });
}

function formatDuration(ms) {
  if (!ms) return '0:00';
  
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  
  return minutes + ':' + (seconds < 10 ? '0' + seconds : seconds);
}

function formatDate(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  const day = date.getDate();
  const month = date.toLocaleString('fr-FR', { month: 'long' });
  const year = date.getFullYear();
  
  return day + ' ' + month + ' ' + year;
}

function setupSearch() {
  const searchInput = document.getElementById('searchInput');
  const searchInputMobile = document.getElementById('searchInputMobile');
  
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      filterTracks(this.value.toLowerCase());
    });
  }
  
  if (searchInputMobile) {
    searchInputMobile.addEventListener('input', function() {
      filterTracks(this.value.toLowerCase());
    });
  }
}

function filterTracks(term) {
  const rows = document.querySelectorAll('#songsTableBody tr');
  rows.forEach(row => {
    const cells = row.cells;
    
    if (cells?.length >= 3) {
      const title = cells[0].textContent.toLowerCase();
      const artist = cells[1].textContent.toLowerCase();
      const album = cells[2].textContent.toLowerCase();
      
      row.style.display = (title.includes(term) || artist.includes(term) || album.includes(term)) ? '' : 'none';
    }
  });
  
  const cards = document.querySelectorAll('#songCardContainer .list-group-item');
  cards.forEach(card => {
    const titleEl = card.querySelector('div:nth-child(1) span');
    const artistEl = card.querySelector('div:nth-child(2) span');
    const albumEl = card.querySelector('div:nth-child(3) span');
    
    if (titleEl && artistEl && albumEl) {
      const cardTitle = titleEl.textContent.toLowerCase();
      const cardArtist = artistEl.textContent.toLowerCase();
      const cardAlbum = albumEl.textContent.toLowerCase();
      
      card.style.display = (cardTitle.includes(term) || cardArtist.includes(term) || cardAlbum.includes(term)) ? '' : 'none';
    }
  });
}

function setupSorting() {
  const headers = document.querySelectorAll('.sortable');
  
  headers.forEach(header => {
    header.style.cursor = 'pointer';
    
    header.addEventListener('click', function() {
      const sortKey = this.dataset.sort;
      let colIndex = 0;
      
      const headerParent = this.parentNode;
      for (let j = 0; j < headerParent.children.length; j++) {
        if (headerParent.children[j] === this) {
          colIndex = j;
          break;
        }
      }
      
      const direction = this.dataset.sortDir === 'asc' ? 'desc' : 'asc';
      this.dataset.sortDir = direction;
      
      const tbody = document.getElementById('songsTableBody');
      const rows = Array.from(tbody.rows);
      
      rows.sort((a, b) => {
        const cellA = a.cells[colIndex].textContent.toLowerCase();
        const cellB = b.cells[colIndex].textContent.toLowerCase();
        
        return direction === 'asc' ? 
          cellA.localeCompare(cellB) : 
          cellB.localeCompare(cellA);
      });
      
      rows.forEach(row => tbody.appendChild(row));
      
      headers.forEach(el => {
        el.classList.remove('text-primary');
        
        const icon = el.querySelector('i');
        if (icon) icon.remove();
      });
      
      this.classList.add('text-primary');
      
      const icon = document.createElement('i');
      icon.className = direction === 'asc' ? 
        'bi bi-sort-alpha-down ms-1' : 
        'bi bi-sort-alpha-up ms-1';
      this.appendChild(icon);
    });
  });
}