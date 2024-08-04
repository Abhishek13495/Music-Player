document.addEventListener('DOMContentLoaded', () => {
    const audioPlayer = document.getElementById('audio-player');
    const playPauseButton = document.getElementById('play-pause');
    const prevButton = document.getElementById('prev');
    const nextButton = document.getElementById('next');
    const shuffleButton = document.getElementById('shuffle');
    const repeatButton = document.getElementById('repeat');
    const volumeControl = document.getElementById('volume');
    const playlist = document.getElementById('playlist');
    const searchInput = document.getElementById('search');
    const progressBar = document.getElementById('progress-bar');
    const progressContainer = document.getElementById('progress-container');
    const currentTimeSpan = document.getElementById('current-time');
    const totalTimeSpan = document.getElementById('total-time');
    const newSongTitle = document.getElementById('new-song-title');
    const newSongArtist = document.getElementById('new-song-artist');
    const newSongUrl = document.getElementById('new-song-url');
    const addSongButton = document.getElementById('add-song');
    const visualizer = document.getElementById('visualizer');
    const ctx = visualizer.getContext('2d');

    let currentTrack = 0;
    let isShuffled = false;
    let isRepeating = false;
    let audioContext;
    let analyser;
    let source;

    let songs = [
        { title: 'Song 1', artist: 'Artist 1', src: 'https://example.com/song1.mp3', category: 'Pop' },
        { title: 'Song 2', artist: 'Artist 2', src: 'https://example.com/song2.mp3', category: 'Rock' },
        { title: 'Song 3', artist: 'Artist 3', src: 'https://example.com/song3.mp3', category: 'Jazz' },
    ];

    function initAudio() {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        source = audioContext.createMediaElementSource(audioPlayer);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
    }

    function loadPlaylist() {
        playlist.innerHTML = '';
        songs.forEach((song, index) => {
            const li = document.createElement('li');
            li.textContent = `${song.title} - ${song.artist}`;
            li.onclick = () => playSong(index);
            playlist.appendChild(li);
        });
    }

    function playSong(index) {
        currentTrack = index;
        audioPlayer.src = songs[currentTrack].src;
        audioPlayer.play().catch(e => console.error("Error playing audio:", e));
        updatePlayPauseIcon();
        updateNowPlaying();
    }

    function updatePlayPauseIcon() {
        playPauseButton.innerHTML = audioPlayer.paused ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>';
    }

    function updateNowPlaying() {
        document.getElementById('track-title').textContent = songs[currentTrack].title;
        document.getElementById('track-artist').textContent = songs[currentTrack].artist;
    }

    function togglePlayPause() {
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        if (audioPlayer.paused) {
            audioPlayer.play().catch(e => console.error("Error playing audio:", e));
        } else {
            audioPlayer.pause();
        }
        updatePlayPauseIcon();
    }

    function playNext() {
        currentTrack = isShuffled ? Math.floor(Math.random() * songs.length) : (currentTrack + 1) % songs.length;
        playSong(currentTrack);
    }

    function playPrev() {
        currentTrack = (currentTrack - 1 + songs.length) % songs.length;
        playSong(currentTrack);
    }

    function toggleShuffle() {
        isShuffled = !isShuffled;
        shuffleButton.style.color = isShuffled ? '#1db954' : '#fff';
    }

    function toggleRepeat() {
        isRepeating = !isRepeating;
        repeatButton.style.color = isRepeating ? '#1db954' : '#fff';
    }

    function updateProgress() {
        const { currentTime, duration } = audioPlayer;
        const progressPercent = (currentTime / duration) * 100;
        progressBar.style.width = `${progressPercent}%`;
        currentTimeSpan.textContent = formatTime(currentTime);
        totalTimeSpan.textContent = formatTime(duration);
    }

    function setProgress(e) {
        const width = this.clientWidth;
        const clickX = e.offsetX;
        const duration = audioPlayer.duration;
        audioPlayer.currentTime = (clickX / width) * duration;
    }

    function formatTime(time) {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }

    function addSong(e) {
        e.preventDefault();
        const newSong = {
            title: newSongTitle.value,
            artist: newSongArtist.value,
            src: newSongUrl.value,
            category: 'Other'
        };
        songs.push(newSong);
        loadPlaylist();
        newSongTitle.value = '';
        newSongArtist.value = '';
        newSongUrl.value = '';
        playLatestSong();
    }

    function playLatestSong() {
        playSong(songs.length - 1);
    }

    function setupVisualizer() {
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        visualizer.width = visualizer.clientWidth;
        visualizer.height = visualizer.clientHeight;

        function draw() {
            requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);
            ctx.fillStyle = 'rgb(0, 0, 0)';
            ctx.fillRect(0, 0, visualizer.width, visualizer.height);
            const barWidth = (visualizer.width / bufferLength) * 2.5;
            let x = 0;
            for (let i = 0; i < bufferLength; i++) {
                const barHeight = dataArray[i] / 2;
                ctx.fillStyle = `rgb(${barHeight + 100}, 50, 50)`;
                ctx.fillRect(x, visualizer.height - barHeight, barWidth, barHeight);
                x += barWidth + 1;
            }
        }
        draw();
    }

    playPauseButton.onclick = togglePlayPause;
    nextButton.onclick = playNext;
    prevButton.onclick = playPrev;
    shuffleButton.onclick = toggleShuffle;
    repeatButton.onclick = toggleRepeat;
    volumeControl.oninput = (e) => { audioPlayer.volume = e.target.value; };
    progressContainer.onclick = setProgress;
    addSongButton.onclick = addSong;

    audioPlayer.addEventListener('timeupdate', updateProgress);
    audioPlayer.addEventListener('ended', () => {
        if (isRepeating) {
            audioPlayer.currentTime = 0;
            audioPlayer.play().catch(e => console.error("Error playing audio:", e));
        } else {
            playNext();
        }
    });

    searchInput.oninput = (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredSongs = songs.filter(song => 
            song.title.toLowerCase().includes(searchTerm) || 
            song.artist.toLowerCase().includes(searchTerm) ||
            song.category.toLowerCase().includes(searchTerm)
        );
        playlist.innerHTML = '';
        filteredSongs.forEach((song, index) => {
            const li = document.createElement('li');
            li.textContent = `${song.title} - ${song.artist}`;
            li.onclick = () => playSong(songs.indexOf(song));
            playlist.appendChild(li);
        });
    };

    initAudio();
    loadPlaylist();
    setupVisualizer();
});