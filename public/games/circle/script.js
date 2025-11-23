class PerfectCircleGame {
    constructor() {
        this.canvas = document.getElementById('drawingCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.overlay = document.getElementById('canvasOverlay');
        this.startBtn = document.getElementById('startBtn');
        this.scoreValue = document.getElementById('scoreValue');
        this.scoreFeedback = document.getElementById('scoreFeedback');
        this.resetBtn = document.getElementById('resetBtn');
        this.shareBtn = document.getElementById('shareBtn');
        this.copyBtn = document.getElementById('copyBtn');
        this.soundToggle = document.getElementById('soundToggle');
        
        // Stats elements
        this.bestScoreEl = document.getElementById('bestScore');
        this.totalAttemptsEl = document.getElementById('totalAttempts');
        this.averageScoreEl = document.getElementById('averageScore');
        
        // Game state
        this.isDrawing = false;
        this.drawingPath = [];
        this.currentScore = 0;
        this.soundEnabled = true;
        this.gameStarted = false;
        
        // Stats
        this.stats = this.loadStats();
        
        // Audio context for sound effects
        this.audioContext = null;
        this.initAudioContext();
        
        this.initEventListeners();
        this.updateStatsDisplay();
        this.setupCanvas();
        
        // Ensure score section and controls are hidden initially
        this.hideScoreAndControls();
    }
    
    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.log('Audio not supported');
        }
    }
    
    playSound(frequency, duration, type = 'sine') {
        if (!this.soundEnabled || !this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    playSoundSequence(notes) {
        if (!this.soundEnabled) return;
        
        notes.forEach((note, index) => {
            setTimeout(() => {
                this.playSound(note.frequency, note.duration, note.type || 'sine');
            }, index * 100);
        });
    }
    
    setupCanvas() {
        // Get canvas size from CSS
        const canvasSize = Math.min(400, Math.min(window.innerWidth * 0.7, window.innerHeight * 0.7));
        const scale = window.devicePixelRatio || 1;
        
        this.canvas.width = canvasSize * scale;
        this.canvas.height = canvasSize * scale;
        this.canvas.style.width = canvasSize + 'px';
        this.canvas.style.height = canvasSize + 'px';
        
        this.ctx.scale(scale, scale);
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = '#4477ff';
    }
    
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
    
    hideScoreAndControls() {
        const scoreSection = document.getElementById('scoreSection');
        const controls = document.getElementById('controls');
        
        if (scoreSection) {
            scoreSection.classList.remove('show');
        }
        if (controls) {
            controls.classList.remove('show');
        }
    }
    
    showScoreAndControls() {
        const scoreSection = document.getElementById('scoreSection');
        const controls = document.getElementById('controls');
        
        if (scoreSection) {
            scoreSection.classList.add('show');
        }
        if (controls) {
            controls.classList.add('show');
        }
    }
    
    initEventListeners() {
        this.startBtn.addEventListener('click', () => this.startGame());
        this.startBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startGame();
        }, { passive: false });
        this.resetBtn.addEventListener('click', () => this.resetGame());
        this.resetBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.resetGame();
        }, { passive: false });
        this.shareBtn.addEventListener('click', () => this.shareScore());
        this.shareBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.shareScore();
        }, { passive: false });
        this.copyBtn.addEventListener('click', () => this.copyScore());
        this.copyBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.copyScore();
        }, { passive: false });
        this.soundToggle.addEventListener('click', () => this.toggleSound());
        this.soundToggle.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.toggleSound();
        }, { passive: false });
        
        // Canvas drawing events
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseleave', () => this.stopDrawing());
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        }, { passive: false });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        }, { passive: false });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const mouseEvent = new MouseEvent('mouseup', {});
            this.canvas.dispatchEvent(mouseEvent);
        }, { passive: false });
        
        // Prevent scrolling on the entire page when touching the game area
        document.body.addEventListener('touchstart', (e) => {
            if (e.target.closest('.game-container')) {
                e.preventDefault();
            }
        }, { passive: false });
        
        document.body.addEventListener('touchmove', (e) => {
            if (e.target.closest('.game-container')) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Keyboard support
        document.addEventListener('keydown', (e) => {
            switch (e.key.toLowerCase()) {
                case ' ':
                case 'enter':
                    e.preventDefault();
                    if (!this.gameStarted) {
                        this.startGame();
                    } else {
                        this.resetGame();
                    }
                    break;
                case 's':
                    e.preventDefault();
                    if (this.gameStarted && this.currentScore > 0) {
                        this.shareScore();
                    }
                    break;
                case 'c':
                    e.preventDefault();
                    if (this.gameStarted && this.currentScore > 0) {
                        this.copyScore();
                    }
                    break;
                case 'm':
                    e.preventDefault();
                    this.toggleSound();
                                         break;
             }
         });
         
         // Handle window resize for responsive canvas
         window.addEventListener('resize', () => {
             this.setupCanvas();
         });
    }
    
    startGame() {
        this.overlay.classList.add('hidden');
        this.gameStarted = true;
        this.canvas.classList.add('drawing-active');
        this.playSound(440, 0.2);
    }
    
    startDrawing(e) {
        if (!this.gameStarted) return;
        
        this.isDrawing = true;
        this.drawingPath = [];
        this.clearCanvas();
        
        const pos = this.getMousePos(e);
        
        this.drawingPath.push(pos);
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x, pos.y);
        
        this.playSound(200, 0.1);
    }
    
    draw(e) {
        if (!this.isDrawing || !this.gameStarted) return;
        
        const pos = this.getMousePos(e);
        
        this.drawingPath.push(pos);
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();
    }
    
    stopDrawing() {
        if (!this.isDrawing || !this.gameStarted) return;
        
        this.isDrawing = false;
        this.canvas.classList.remove('drawing-active');
        
        if (this.drawingPath.length > 10) {
            this.calculateScore();
        }
        
        this.playSound(300, 0.3);
    }
    
    calculateScore() {
        if (this.drawingPath.length < 10) return;
        
        // Find the center and radius of the drawn shape
        const center = this.findCenter();
        const avgRadius = this.calculateAverageRadius(center);
        
        // Calculate how circular the shape is
        const circularityScore = this.calculateCircularity(center, avgRadius);
        
        // Calculate completeness (how close to a full circle)
        const completenessScore = this.calculateCompleteness();
        
        // Calculate smoothness
        const smoothnessScore = this.calculateSmoothness();
        
        // Combine scores with weights
        const finalScore = Math.round(
            circularityScore * 0.5 + 
            completenessScore * 0.3 + 
            smoothnessScore * 0.2
        );
        
        this.currentScore = Math.max(0, Math.min(100, finalScore));
        this.displayScore();
        this.updateStats();
        this.playScoreSound();
    }
    
    findCenter() {
        let sumX = 0, sumY = 0;
        for (const point of this.drawingPath) {
            sumX += point.x;
            sumY += point.y;
        }
        return {
            x: sumX / this.drawingPath.length,
            y: sumY / this.drawingPath.length
        };
    }
    
    calculateAverageRadius(center) {
        let sumRadius = 0;
        for (const point of this.drawingPath) {
            const distance = Math.sqrt(
                Math.pow(point.x - center.x, 2) + 
                Math.pow(point.y - center.y, 2)
            );
            sumRadius += distance;
        }
        return sumRadius / this.drawingPath.length;
    }
    
    calculateCircularity(center, avgRadius) {
        let totalDeviation = 0;
        for (const point of this.drawingPath) {
            const distance = Math.sqrt(
                Math.pow(point.x - center.x, 2) + 
                Math.pow(point.y - center.y, 2)
            );
            totalDeviation += Math.abs(distance - avgRadius);
        }
        
        const averageDeviation = totalDeviation / this.drawingPath.length;
        const deviationRatio = averageDeviation / avgRadius;
        
        return Math.max(0, 100 - (deviationRatio * 300));
    }
    
    calculateCompleteness() {
        if (this.drawingPath.length < 2) return 0;
        
        const start = this.drawingPath[0];
        const end = this.drawingPath[this.drawingPath.length - 1];
        const distance = Math.sqrt(
            Math.pow(end.x - start.x, 2) + 
            Math.pow(end.y - start.y, 2)
        );
        
        // Calculate the expected circumference
        const center = this.findCenter();
        const avgRadius = this.calculateAverageRadius(center);
        const expectedCircumference = 2 * Math.PI * avgRadius;
        
        // Calculate actual path length
        let pathLength = 0;
        for (let i = 1; i < this.drawingPath.length; i++) {
            const prev = this.drawingPath[i - 1];
            const curr = this.drawingPath[i];
            pathLength += Math.sqrt(
                Math.pow(curr.x - prev.x, 2) + 
                Math.pow(curr.y - prev.y, 2)
            );
        }
        
        const completenessRatio = pathLength / expectedCircumference;
        const closenessScore = Math.max(0, 100 - (distance / avgRadius) * 100);
        
        return (Math.min(completenessRatio, 1) * 70) + (closenessScore * 0.3);
    }
    
    calculateSmoothness() {
        if (this.drawingPath.length < 3) return 100;
        
        let totalAngleChange = 0;
        let angleChanges = 0;
        
        for (let i = 2; i < this.drawingPath.length; i++) {
            const p1 = this.drawingPath[i - 2];
            const p2 = this.drawingPath[i - 1];
            const p3 = this.drawingPath[i];
            
            const angle1 = Math.atan2(p2.y - p1.y, p2.x - p1.x);
            const angle2 = Math.atan2(p3.y - p2.y, p3.x - p2.x);
            
            let angleDiff = Math.abs(angle2 - angle1);
            if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
            
            totalAngleChange += angleDiff;
            angleChanges++;
        }
        
        if (angleChanges === 0) return 100;
        
        const avgAngleChange = totalAngleChange / angleChanges;
        const expectedAngleChange = (2 * Math.PI) / this.drawingPath.length;
        const smoothnessRatio = Math.min(expectedAngleChange / avgAngleChange, 1);
        
        return smoothnessRatio * 100;
    }
    
    displayScore() {
        // Update score value with appropriate color class
        this.scoreValue.textContent = this.currentScore + '%';
        this.scoreValue.classList.add('score-animated');
        
        // Remove existing color classes
        this.scoreValue.classList.remove('good', 'excellent');
        
        // Add color class based on score
        if (this.currentScore >= 85) {
            this.scoreValue.classList.add('excellent');
        } else if (this.currentScore >= 60) {
            this.scoreValue.classList.add('good');
        }
        
        // Check if it's a new best score
        const isNewBest = this.currentScore > this.stats.bestScore;
        
        // Update score label
        const scoreLabel = document.getElementById('scoreLabel');
        if (isNewBest && this.stats.bestScore > 0) {
            scoreLabel.textContent = 'New best score';
        } else {
            scoreLabel.textContent = 'Perfect Circle Score';
        }
        
        // Show feedback (simplified for cleaner look)
        let feedback = '';
        if (this.currentScore >= 95) {
            feedback = 'Nearly perfect!';
        } else if (this.currentScore >= 85) {
            feedback = 'Excellent!';
        } else if (this.currentScore >= 70) {
            feedback = 'Pretty good!';
        } else if (this.currentScore >= 50) {
            feedback = 'Not bad!';
        } else {
            feedback = 'Keep trying!';
        }
        
        this.scoreFeedback.textContent = feedback;
        
        // Show score section and controls
        this.showScoreAndControls();
        
        // Accessibility announcement
        const announcement = `Score: ${this.currentScore}%. ${feedback}`;
        this.announceToScreenReader(announcement);
        
        // Play appropriate sound
        this.playScoreSound();
        
        // Remove animation class after animation completes
        setTimeout(() => {
            this.scoreValue.classList.remove('score-animated');
        }, 600);
    }
    
    playScoreSound() {
        const score = this.currentScore;
        
        if (score >= 95) {
            // Perfect score - triumphant sound
            this.playSoundSequence([
                { frequency: 523, duration: 0.2 }, // C
                { frequency: 659, duration: 0.2 }, // E
                { frequency: 784, duration: 0.2 }, // G
                { frequency: 1047, duration: 0.4 } // C (octave)
            ]);
        } else if (score >= 85) {
            // Excellent - success sound
            this.playSoundSequence([
                { frequency: 440, duration: 0.2 }, // A
                { frequency: 554, duration: 0.2 }, // C#
                { frequency: 659, duration: 0.3 }  // E
            ]);
        } else if (score >= 70) {
            // Good - positive sound
            this.playSoundSequence([
                { frequency: 392, duration: 0.2 }, // G
                { frequency: 523, duration: 0.3 }  // C
            ]);
        } else if (score >= 50) {
            // Average - neutral sound
            this.playSound(349, 0.3); // F
        } else {
            // Poor - encouraging sound
            this.playSound(262, 0.4); // C (low)
        }
    }
    
    updateStats() {
        this.stats.totalAttempts++;
        this.stats.totalScore += this.currentScore;
        
        if (this.currentScore > this.stats.bestScore) {
            this.stats.bestScore = this.currentScore;
        }
        
        this.stats.averageScore = Math.round(this.stats.totalScore / this.stats.totalAttempts);
        
        this.saveStats();
        this.updateStatsDisplay();
    }
    
    updateStatsDisplay() {
        this.bestScoreEl.textContent = this.stats.bestScore + '%';
        this.totalAttemptsEl.textContent = this.stats.totalAttempts;
        this.averageScoreEl.textContent = this.stats.averageScore + '%';
    }
    
    loadStats() {
        const saved = localStorage.getItem('perfectCircleStats');
        if (saved) {
            return JSON.parse(saved);
        }
        return {
            bestScore: 0,
            totalAttempts: 0,
            totalScore: 0,
            averageScore: 0
        };
    }
    
    saveStats() {
        localStorage.setItem('perfectCircleStats', JSON.stringify(this.stats));
    }
    
    resetGame() {
        this.clearCanvas();
        this.drawingPath = [];
        this.currentScore = 0;
        this.scoreValue.textContent = '0%';
        this.scoreFeedback.textContent = '';
        this.scoreValue.classList.remove('good', 'excellent');
        
        // Hide score section and controls
        this.hideScoreAndControls();
        
        // Show overlay to start again
        this.overlay.classList.remove('hidden');
        this.gameStarted = false;
        this.canvas.classList.remove('drawing-active');
        
        this.playSound(330, 0.2);
    }
    
    announceToScreenReader(message) {
        const announcements = document.getElementById('announcements');
        if (announcements) {
            announcements.textContent = message;
            // Clear after a delay
            setTimeout(() => {
                announcements.textContent = '';
            }, 1000);
        }
    }
    
    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    shareScore() {
        let scoreEmoji = '';
        if (this.currentScore >= 95) {
            scoreEmoji = '🎯';
        } else if (this.currentScore >= 85) {
            scoreEmoji = '🌟';
        } else if (this.currentScore >= 70) {
            scoreEmoji = '👍';
        } else if (this.currentScore >= 50) {
            scoreEmoji = '👌';
        } else {
            scoreEmoji = '🔄';
        }
        
        const text = `I scored ${this.currentScore}% on the Perfect Circle Game! ${scoreEmoji}`;
        const url = window.location.href;
        const hashtags = 'PerfectCircle,Game,Challenge';
        
        // Create Twitter share URL
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=${hashtags}`;
        
        // If on mobile or desktop, try native share first, then fallback to Twitter
        if (navigator.share && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            navigator.share({
                title: 'Perfect Circle Game',
                text: text,
                url: url
            }).catch(() => {
                // Fallback to Twitter
                window.open(twitterUrl, '_blank');
            });
        } else {
            // Open Twitter share dialog
            window.open(twitterUrl, '_blank', 'width=550,height=420');
        }
        
        this.playSound(523, 0.2);
    }
    
    copyScore() {
        let scoreEmoji = '';
        if (this.currentScore >= 95) {
            scoreEmoji = '🎯';
        } else if (this.currentScore >= 85) {
            scoreEmoji = '🌟';
        } else if (this.currentScore >= 70) {
            scoreEmoji = '👍';
        } else if (this.currentScore >= 50) {
            scoreEmoji = '👌';
        } else {
            scoreEmoji = '🔄';
        }
        
        const text = `I scored ${this.currentScore}% on the Perfect Circle Game! ${scoreEmoji} ${window.location.href}`;
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                const originalText = this.copyBtn.textContent;
                this.copyBtn.textContent = '✓ Copied!';
                setTimeout(() => {
                    this.copyBtn.textContent = originalText;
                }, 2000);
            });
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            const originalText = this.copyBtn.textContent;
            this.copyBtn.textContent = '✓ Copied!';
            setTimeout(() => {
                this.copyBtn.textContent = originalText;
            }, 2000);
        }
        
        this.playSound(523, 0.2);
    }
    
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const icon = this.soundToggle.querySelector('.sound-icon');
        icon.textContent = this.soundEnabled ? '🔊' : '🔇';
        
        // Play a test sound when enabling
        if (this.soundEnabled) {
            this.playSound(440, 0.2);
        }
    }
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new PerfectCircleGame();
    
    // Add some visual enhancements
    const canvas = document.getElementById('drawingCanvas');
    
    // Add glow effect while drawing
    canvas.addEventListener('mousedown', () => {
        canvas.style.boxShadow = '0 0 20px rgba(99, 102, 241, 0.5)';
    });
    
    canvas.addEventListener('mouseup', () => {
        canvas.style.boxShadow = '';
    });
    
    // Add subtle animation to the page elements
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    });
    
    document.querySelectorAll('.stats-panel, .instructions, .score-section').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            if (!game.gameStarted) {
                game.startGame();
            } else {
                game.resetGame();
            }
        } else if (e.key === 's' || e.key === 'S') {
            e.preventDefault();
            game.shareScore();
        } else if (e.key === 'm' || e.key === 'M') {
            e.preventDefault();
            game.toggleSound();
        }
    });
});

// Add service worker for offline functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('SW registered'))
            .catch(error => console.log('SW registration failed'));
    });
}
