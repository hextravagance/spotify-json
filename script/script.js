document.addEventListener('DOMContentLoaded', function () {
  fetch('data.json')
    .then(function(response) {
      return response.json();
    })
    .then(function(tracks) {
      generateCharts(tracks);
      populateSongsTable(tracks);
      setupSearch();
      setupSorting();
      document.getElementById('songCount').textContent = tracks.length;
      setupModalListener(tracks);
      AlbumPopulaire(tracks);
    })
    .catch(function(err) {
      console.error('Erreur lors du chargement des données :', err);
    });
});

function generateCharts(tracks) {
  var artistCount = {};
  var genreCount = {};

  for (var i = 0; i < tracks.length; i++) {
    var track = tracks[i];
    
    for (var j = 0; j < track.artists.length; j++) {
      var artistName = track.artists[j].name;
      if (artistCount[artistName]) {
        artistCount[artistName]++;
      } else {
        artistCount[artistName] = 1;
      }
    }

    if (track.album && track.album.genres && Array.isArray(track.album.genres)) {
      for (var k = 0; k < track.album.genres.length; k++) {
        var genre = track.album.genres[k];
        if (genreCount[genre]) {
          genreCount[genre]++;
        } else {
          genreCount[genre] = 1;
        }
      }
    }
    
    if ((!track.album || !track.album.genres || track.album.genres.length === 0) && track.artists) {
      for (var l = 0; l < track.artists.length; l++) {
        var artist = track.artists[l];
        if (artist.genres && Array.isArray(artist.genres)) {
          for (var m = 0; m < artist.genres.length; m++) {
            var artistGenre = artist.genres[m];
            if (genreCount[artistGenre]) {
              genreCount[artistGenre]++;
            } else {
              genreCount[artistGenre] = 1;
            }
          }
        }
      }
    }
  }

  var artistArray = [];
  for (var artist in artistCount) {
    artistArray.push([artist, artistCount[artist]]);
  }
  
  artistArray.sort(function(a, b) {
    return b[1] - a[1];
  });
  
  var topArtists = artistArray.slice(0, 10);

  var genreArray = [];
  for (var genre in genreCount) {
    genreArray.push([genre, genreCount[genre]]);
  }
  
  genreArray.sort(function(a, b) {
    return b[1] - a[1];
  });
  
  if (genreArray.length > 7) {
    var topGenres = genreArray.slice(0, 6);
    var otherGenres = genreArray.slice(6);
    
    var otherCount = 0;
    for (var n = 0; n < otherGenres.length; n++) {
      otherCount += otherGenres[n][1];
    }
    
    if (otherCount > 0) {
      topGenres.push(['Autres', otherCount]);
    }
    
    genreArray = topGenres;
  }

  renderArtistsChart(topArtists);
  renderGenresChart(genreArray);
}

function renderArtistsChart(data) {
  var ctx = document.getElementById('artistsChart').getContext('2d');
  
  var labels = [];
  var values = [];
  for (var i = 0; i < data.length; i++) {
    labels.push(data[i][0]);
    values.push(data[i][1]);
  }

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Nombre de morceaux',
        data: values,
        backgroundColor: 'rgba(100, 181, 246, 0.6)',
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
        legend: {
          display: false
        },
        subtitle: {  
          display: true,
          text: 'Nombre de morceaux',
          position: 'bottom',
          font: { size: 12 },
        }
      },
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

function renderGenresChart(data) {
  var ctx = document.getElementById('genresChart').getContext('2d');
  
  var colors = [
    '#ff91a9',
    '#72bef1',
    '#ffdd88',
    '#81d3d3',
    '#b794ff',
    '#ffbc79',
    '#6cdb9b',
    '#b5c0c1',
  ];
  
  var labels = [];
  var values = [];
  for (var i = 0; i < data.length; i++) {
    labels.push(data[i][0]);
    values.push(data[i][1]);
  }
  
  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
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
              var label = context.label || '';
              var value = context.raw || 0;
              
              var total = 0;
              for (var i = 0; i < context.dataset.data.length; i++) {
                total += context.dataset.data[i];
              }
              
              var percentage = Math.round((value / total) * 100);
              return label + ': ' + value + ' (' + percentage + '%)';
            }
          }
        }
      },
      responsive: true,
      maintainAspectRatio: false
    }
  });
}