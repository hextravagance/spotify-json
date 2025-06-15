document.addEventListener('DOMContentLoaded', function () {
  fetch('data.json')
    .then(response => response.json())
    .then(donnees => {
      creerGraphiques(donnees);
      remplirTable(donnees);
      remplirCartes(donnees);
      activerRecherche();
      activerTri();
      gererModale(donnees);
      afficherAlbumsPopulaires(donnees);
    })
    .catch(error => console.error('Erreur lors du chargement des données :', error));
});

function creerImageParDefaut(taille = 300) {
  const canvas = document.createElement('canvas');
  canvas.width = taille;
  canvas.height = taille;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#e0e0e0';
  ctx.fillRect(0, 0, taille, taille);

  ctx.fillStyle = '#9e9e9e';
  ctx.font = taille / 4 + 'px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('♫', taille / 2, taille / 2);

  return canvas.toDataURL();
}

function creerGraphiques(tracks) {
  const artistes = {};
  const genres = {};

  tracks.forEach(track => {
    track.artists.forEach(artiste => {
      if (!artistes[artiste.name]) artistes[artiste.name] = 0;
      artistes[artiste.name]++;

      if (artiste.genres) {
        artiste.genres.forEach(genre => {
          if (!genres[genre]) genres[genre] = 0;
          genres[genre]++;
        });
      }
    });

    if (track.album && track.album.genres) {
      track.album.genres.forEach(genre => {
        if (!genres[genre]) genres[genre] = 0;
        genres[genre]++;
      });
    }
  });

  const topArtistes = Object.entries(artistes).sort((a, b) => b[1] - a[1]).slice(0, 10);
  let genreArray = Object.entries(genres).sort((a, b) => b[1] - a[1]);

  if (genreArray.length > 7) {
    const autres = genreArray.slice(6).reduce((acc, g) => acc + g[1], 0);
    genreArray = genreArray.slice(0, 6);
    genreArray.push(['Autres', autres]);
  }

  dessinerGraphiqueArtistes(topArtistes);
  dessinerGraphiqueGenres(genreArray);
}

function dessinerGraphiqueArtistes(data) {
  const ctx = document.getElementById('artistsChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(item => item[0]),
      datasets: [{
        label: 'Nombre de morceaux',
        data: data.map(item => item[1]),
        backgroundColor: 'rgba(100, 181, 246, 0.6)'
      }]
    },
    options: {
      indexAxis: 'y',
      plugins: {
        title: {
          display: true,
          text: 'Top 10 artistes (nombre de morceaux)'
        },
        subtitle: {
          display: true,
          text: 'Nombre de morceaux',
          position: 'bottom'
        },
        legend: { display: false }
      },
      responsive: true
    }
  });
}

function dessinerGraphiqueGenres(data) {
  const ctx = document.getElementById('genresChart').getContext('2d');
  const couleurs = ['#FF9AA2', '#74B9FF', '#FFD700', '#55EDBF', '#B19CD9', '#FF9966', '#A3D39C', '#CCCCCC'];

  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: data.map(item => item[0]),
      datasets: [{
        data: data.map(item => item[1]),
        backgroundColor: couleurs.slice(0, data.length)
      }]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: 'Genres musicaux'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const value = context.raw;
              const percent = Math.round((value / total) * 100);
              return `${context.label}: ${value} (${percent}%)`;
            }
          }
        }
      },
      responsive: true
    }
  });
}

function remplirTable(tracks) {
  const tbody = document.getElementById('songsTableBody');
  tbody.innerHTML = '';

  tracks.forEach(track => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${track.name}</td>
      <td>${track.artists.map(a => a.name).join(', ')}</td>
      <td>${track.album?.name || ''}</td>
      <td class="text-center">
        <button class="btn btn-sm btn-primary details-btn" data-bs-toggle="modal" data-bs-target="#songDetailModal" data-song-id="${track.id}">
          <i class="bi bi-info-circle"></i> Détails
        </button>
      </td>`;
    tbody.appendChild(tr);
  });
}

function remplirCartes(tracks) {
  const container = document.getElementById('songCardContainer');
  container.innerHTML = '';

  tracks.forEach(track => {
    const div = document.createElement('div');
    div.className = 'list-group-item p-3 border-bottom';
    div.setAttribute('data-track-id', track.id);

    div.innerHTML = `
      <div class="row g-2">
        <div class="col-12"><strong>Titre</strong>: ${track.name}</div>
        <div class="col-12"><strong>Artiste</strong>: ${track.artists.map(a => a.name).join(', ')}</div>
        <div class="col-12"><strong>Album</strong>: ${track.album?.name || ''}</div>
        <div class="col-12 text-end mt-2">
          <button class="btn btn-sm btn-primary details-btn" data-bs-toggle="modal" data-bs-target="#songDetailModal" data-song-id="${track.id}">
            <i class="bi bi-info-circle"></i> Détails
          </button>
        </div>
      </div>`;
    container.appendChild(div);
  });
}

function activerRecherche() {
  const champs = [document.getElementById('searchInput'), document.getElementById('searchInputMobile')];

  champs.forEach(input => {
    if (input) {
      input.addEventListener('input', () => {
        const terme = input.value.toLowerCase();

        document.querySelectorAll('#songsTableBody tr').forEach(row => {
          row.style.display = row.textContent.toLowerCase().includes(terme) ? '' : 'none';
        });

        document.querySelectorAll('#songCardContainer .list-group-item').forEach(card => {
          card.style.display = card.textContent.toLowerCase().includes(terme) ? '' : 'none';
        });
      });
    }
  });
}

function activerTri() {
  document.querySelectorAll('.sortable').forEach(header => {
    header.style.cursor = 'pointer';
    header.addEventListener('click', () => {
      const index = Array.from(header.parentNode.children).indexOf(header);
      const dir = header.dataset.sortDir === 'asc' ? 'desc' : 'asc';
      header.dataset.sortDir = dir;

      const tbody = document.getElementById('songsTableBody');
      const rows = Array.from(tbody.rows);

      rows.sort((a, b) => {
        const valA = a.cells[index].textContent.toLowerCase();
        const valB = b.cells[index].textContent.toLowerCase();
        return dir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      });

      rows.forEach(row => tbody.appendChild(row));
    });
  });
}

function gererModale(tracks) {
  const modal = document.getElementById('songDetailModal');
  modal.addEventListener('show.bs.modal', event => {
    const button = event.relatedTarget;
    const songId = button.getAttribute('data-song-id');
    const track = tracks.find(t => t.id === songId);

    if (!track) return;

    document.getElementById('modalSongTitle').textContent = track.name;
    document.getElementById('modalSongDuration').textContent = formatDuree(track.duration_ms);
    document.getElementById('modalSongPopularity').textContent = track.popularity || 0;
    document.getElementById('modalTrackNumber').textContent = track.track_number || 1;
    document.getElementById('modalExplicit').textContent = track.explicit ? 'Oui' : 'Non';

    const img = document.getElementById('modalAlbumImage');
    img.src = track.album?.images?.[0]?.url || creerImageParDefaut(300);
    img.alt = 'Album-cover-' + (track.album?.name || '');

    document.getElementById('modalReleaseDate').textContent = formatDateFr(track.album?.release_date);
    document.getElementById('modalAlbumPopularity').textContent = 'Popularité: ' + (track.album?.popularity || 0);

    const audio = document.getElementById('modalAudioPreview');
    if (track.preview_url) {
      audio.src = track.preview_url;
      audio.style.display = 'block';
    } else {
      audio.style.display = 'none';
    }

    const ul = document.getElementById('modalArtistsList');
    ul.innerHTML = '<strong>Artistes :</strong>';
    const list = document.createElement('ul');
    list.className = 'list-unstyled mt-1';
    track.artists.forEach(artist => {
      const li = document.createElement('li');
      li.innerHTML = `<img src="${artist.images?.[0]?.url || creerImageParDefaut(30)}" class="rounded-circle me-2" width="30" height="30"> ${artist.name}`;
      list.appendChild(li);
    });
    ul.appendChild(list);

    const genres = document.getElementById('modalGenres');
    genres.innerHTML = '';
    const genreList = track.album?.genres || [];
    if (genreList.length > 0) {
      genreList.forEach(genre => {
        const span = document.createElement('span');
        span.className = 'badge bg-secondary me-1';
        span.textContent = genre;
        genres.appendChild(span);
      });
    } else {
      genres.textContent = 'Aucun genre disponible';
    }

    const link = document.getElementById('modalSpotifyLink');
    if (track.external_urls?.spotify) {
      link.href = track.external_urls.spotify;
      link.style.display = 'inline-block';
    } else {
      link.style.display = 'none';
    }
  });
}

function afficherAlbumsPopulaires(tracks) {
  const albums = {};
  tracks.forEach(track => {
    const album = track.album;
    if (!albums[album.id]) {
      albums[album.id] = {
        ...album,
        trackCount: 0,
        artistNames: []
      };
    }
    albums[album.id].trackCount++;
    track.artists.forEach(a => {
      if (!albums[album.id].artistNames.includes(a.name)) {
        albums[album.id].artistNames.push(a.name);
      }
    });
  });

  const albumList = Object.values(albums).sort((a, b) => b.popularity - a.popularity).slice(0, 12);
  const container = document.getElementById('popularAlbums');
  container.innerHTML = '';

  albumList.forEach(album => {
    const col = document.createElement('div');
    col.className = 'col';

    col.innerHTML = `
      <div class="card h-100 shadow-sm">
        <img src="${album.images?.[0]?.url || creerImageParDefaut()}" class="card-img-top" style="height:200px; object-fit:cover;">
        <div class="card-body">
          <h5 class="card-title text-truncate">${album.name}</h5>
          <p class="card-text text-truncate">${album.artistNames[0] || ''}</p>
          <p class="card-text"><small class="text-muted">${formatDateFr(album.release_date)}</small></p>
          <div class="d-flex justify-content-between">
            <span class="badge bg-primary">${album.trackCount} titres</span>
            <span class="badge bg-success">${album.popularity}/100</span>
          </div>
        </div>
      </div>`;

    container.appendChild(col);
  });
}

function formatDuree(ms) {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${min}:${sec < 10 ? '0' + sec : sec}`;
}

function formatDateFr(dateStr) {
  const d = new Date(dateStr);
  return `${d.getDate()} ${d.toLocaleString('fr-FR', { month: 'long' })} ${d.getFullYear()}`;
}