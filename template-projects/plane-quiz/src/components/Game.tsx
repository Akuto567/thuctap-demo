import React, { useState, useEffect, useRef, useCallback } from 'react';
import './Game.css';

declare global {
  interface Window {
    win?: {
      DATA?: {
        playerName?: string;
        maxLives?: number;
        questions?: Question[];
      };
    };
  }
}

// Hàm đọc dữ liệu từ win.DATA
const getGameData = () => {
  if (typeof window !== 'undefined' && window.win?.DATA) {
    console.log('✅ Đã tải dữ liệu từ win.DATA:', window.win.DATA);
    return window.win.DATA;
  }
  return {};
};

// Đọc dữ liệu ngay khi file được load
const gameData = getGameData();

export interface Answer {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  question: string;
  imagePath: string | null;
  answers: Answer[];
  multipleCorrect: boolean;
  _answerCounter: number;
}

interface Cloud {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  answer: string;
  speed: number;
  isCorrect: boolean | null;
}

interface Explosion {
  x: number;
  y: number;
  width: number;
  height: number;
  frame: number;
  id: number;
}

const Game: React.FC = () => {
  const [playerY, setPlayerY] = useState(300);
  const [gameOver, setGameOver] = useState(false);
  const [gameWin, setGameWin] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [explosions, setExplosions] = useState<Explosion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [resultType, setResultType] = useState<'success' | 'error' | 'win'>('success');
  const speedLevels = [1, 2, 4, 6];
  
  // Speed control states
  const [gameSpeed, setGameSpeed] = useState<number>(1);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  
  // Auto-increasing speed states
  const [baseGameSpeed, setBaseGameSpeed] = useState<number>(2);
  const [answeredCorrectCount, setAnsweredCorrectCount] = useState<number>(0);

  // Thêm ref này cùng với các ref khác
  const cloudSubPixelXRef = useRef<Map<number, number>>(new Map());

  const sampleQuestions: Question[] = [
    {
      id: "1",
      question: "Question 1: What color is the sky?",
      imagePath: null,
      answers: [
        { id: "1_1", text: "Blue", isCorrect: true },
        { id: "1_2", text: "Red", isCorrect: false },
        { id: "1_3", text: "Green", isCorrect: false },
        { id: "1_4", text: "Yellow", isCorrect: false },
        { id: "1_5", text: "Purple", isCorrect: false },
        { id: "1_6", text: "Black", isCorrect: false },
        { id: "1_7", text: "White", isCorrect: false }
      ],
      multipleCorrect: false,
      _answerCounter: 7
    },
    {
      id: "2",
      question: "Question 2: What animal says 'meow'?",
      imagePath: null,
      answers: [
        { id: "2_1", text: "Dog", isCorrect: false },
        { id: "2_2", text: "Cat", isCorrect: true },
        { id: "2_3", text: "Bird", isCorrect: false },
        { id: "2_4", text: "Fish", isCorrect: false },
        { id: "2_5", text: "Cow", isCorrect: false },
        { id: "2_6", text: "Duck", isCorrect: false },
        { id: "2_7", text: "Horse", isCorrect: false }
      ],
      multipleCorrect: false,
      _answerCounter: 7
    },
    {
      id: "3",
      question: "Question 3: How many legs does a dog have?",
      imagePath: null,
      answers: [
        { id: "3_1", text: "2", isCorrect: false },
        { id: "3_2", text: "3", isCorrect: false },
        { id: "3_3", text: "4", isCorrect: true },
        { id: "3_4", text: "5", isCorrect: false },
        { id: "3_5", text: "6", isCorrect: false },
        { id: "3_6", text: "7", isCorrect: false },
        { id: "3_7", text: "8", isCorrect: false }
      ],
      multipleCorrect: false,
      _answerCounter: 7
    },
    {
      id: "4",
      question: "Question 4: What do you drink every day to stay hydrated?",
      imagePath: null,
      answers: [
        { id: "4_1", text: "Milk", isCorrect: false },
        { id: "4_2", text: "Water", isCorrect: true },
        { id: "4_3", text: "Juice", isCorrect: false },
        { id: "4_4", text: "Tea", isCorrect: false },
        { id: "4_5", text: "Coffee", isCorrect: false },
        { id: "4_6", text: "Soup", isCorrect: false },
        { id: "4_7", text: "Soda", isCorrect: false }
      ],
      multipleCorrect: false,
      _answerCounter: 7
    },
    {
      id: "5",
      question: "Question 5: What fruit is yellow?",
      imagePath: null,
      answers: [
        { id: "5_1", text: "Apple", isCorrect: false },
        { id: "5_2", text: "Banana", isCorrect: true },
        { id: "5_3", text: "Orange", isCorrect: false },
        { id: "5_4", text: "Grape", isCorrect: false },
        { id: "5_5", text: "Strawberry", isCorrect: false },
        { id: "5_6", text: "Mango", isCorrect: false },
        { id: "5_7", text: "Blueberry", isCorrect: false }
      ],
      multipleCorrect: false,
      _answerCounter: 7
    },
    {
      id: "6",
      question: "Question 6: What is the opposite of 'big'?",
      imagePath: null,
      answers: [
        { id: "6_1", text: "Small", isCorrect: true },
        { id: "6_2", text: "Tall", isCorrect: false },
        { id: "6_3", text: "Fast", isCorrect: false },
        { id: "6_4", text: "Hot", isCorrect: false },
        { id: "6_5", text: "Cold", isCorrect: false },
        { id: "6_6", text: "Happy", isCorrect: false },
        { id: "6_7", text: "Strong", isCorrect: false }
      ],
      multipleCorrect: false,
      _answerCounter: 7
    },
    {
      id: "7",
      question: "Question 7: Which one is a color?",
      imagePath: null,
      answers: [
        { id: "7_1", text: "Dog", isCorrect: false },
        { id: "7_2", text: "Chair", isCorrect: false },
        { id: "7_3", text: "Blue", isCorrect: true },
        { id: "7_4", text: "Run", isCorrect: false },
        { id: "7_5", text: "Eat", isCorrect: false },
        { id: "7_6", text: "Book", isCorrect: false },
        { id: "7_7", text: "Car", isCorrect: false }
      ],
      multipleCorrect: false,
      _answerCounter: 7
    },
    {
      id: "8",
      question: "Question 8: What do you use to write?",
      imagePath: null,
      answers: [
        { id: "8_1", text: "Pen", isCorrect: true },
        { id: "8_2", text: "Shoe", isCorrect: false },
        { id: "8_3", text: "Table", isCorrect: false },
        { id: "8_4", text: "Car", isCorrect: false },
        { id: "8_5", text: "Phone", isCorrect: false },
        { id: "8_6", text: "Bag", isCorrect: false },
        { id: "8_7", text: "Hat", isCorrect: false }
      ],
      multipleCorrect: false,
      _answerCounter: 7
    },
    {
      id: "9",
      question: "Question 9: Which one can fly?",
      imagePath: null,
      answers: [
        { id: "9_1", text: "Dog", isCorrect: false },
        { id: "9_2", text: "Cat", isCorrect: false },
        { id: "9_3", text: "Bird", isCorrect: true },
        { id: "9_4", text: "Fish", isCorrect: false },
        { id: "9_5", text: "Cow", isCorrect: false },
        { id: "9_6", text: "Pig", isCorrect: false },
        { id: "9_7", text: "Sheep", isCorrect: false }
      ],
      multipleCorrect: false,
      _answerCounter: 7
    },
    {
      id: "10",
      question: "Question 10: What is the color of grass?",
      imagePath: null,
      answers: [
        { id: "10_1", text: "Blue", isCorrect: false },
        { id: "10_2", text: "Red", isCorrect: false },
        { id: "10_3", text: "Green", isCorrect: true },
        { id: "10_4", text: "Yellow", isCorrect: false },
        { id: "10_5", text: "Black", isCorrect: false },
        { id: "10_6", text: "White", isCorrect: false },
        { id: "10_7", text: "Purple", isCorrect: false }
      ],
      multipleCorrect: false,
      _answerCounter: 7
    }
  ];
  
  // State cho form nhập câu hỏi
  const [customQuestions, setCustomQuestions] = useState<Question[]>(() => {
    if (gameData.questions && gameData.questions.length > 0) {
      return gameData.questions;
    }
    return sampleQuestions;
  });
  
  const [newQuestion, setNewQuestion] = useState({
    question: '',
    answer1: '',
    answer2: '',
    answer3: '',
    answer4: '',
    answer5: '',
    answer6: '',
    answer7: '',
    correctAnswer: ''
  });
  
  // IFrame states
  const [isInvincible, setIsInvincible] = useState(false);
  const [invincibleTimer, setInvincibleTimer] = useState(0);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const explosionAnimationRef = useRef<number>(0);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const backgroundXRef = useRef(0);
  const cloudsRef = useRef<Cloud[]>([]);
  const nextIdRef = useRef(0);
  
  // Refs for timeouts
  const invincibleTimeoutRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);
  
  // Images
  const backgroundImage = useRef<HTMLImageElement>(new Image());
  const playerImage = useRef<HTMLImageElement>(new Image());
  const cloudImage = useRef<HTMLImageElement>(new Image());
  const tickImage = useRef<HTMLImageElement>(new Image());
  const crossImage = useRef<HTMLImageElement>(new Image());
  const explosionImage = useRef<HTMLImageElement>(new Image());

  // Sử dụng câu hỏi custom nếu có, nếu không thì dùng mẫu
  const questions = customQuestions.length > 0 ? customQuestions : sampleQuestions;
  
  // Scale factors
  const PLAYER_SIZE = Math.min(120, canvasSize.height * 0.15);
  const PLAYER_WIDTH = PLAYER_SIZE;
  const PLAYER_HEIGHT = PLAYER_SIZE;
  const PLAYER_X = canvasSize.width * 0.1;
  const PLAYER_SPEED = canvasSize.height * 0.01;
  
  // Cloud settings
  const CLOUD_SIZE = PLAYER_SIZE * 1.2;
  const CLOUD_WIDTH = CLOUD_SIZE * 1.5;
  const CLOUD_HEIGHT = CLOUD_SIZE;
  const BASE_CLOUD_SPEED = canvasSize.width * 0.0015;
  const BASE_BACKGROUND_SPEED = canvasSize.width * 0.0015;
  const MAX_CLOUDS = 7;

  // Hitbox
  const HITBOX_SCALE = 0.6;
  const PLAYER_HITBOX_WIDTH = PLAYER_WIDTH * HITBOX_SCALE;
  const PLAYER_HITBOX_HEIGHT = PLAYER_HEIGHT * HITBOX_SCALE;
  const PLAYER_HITBOX_X = PLAYER_X + (PLAYER_WIDTH - PLAYER_HITBOX_WIDTH) / 2;

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;

  // Hàm reset game - dùng cho chơi lại
  const resetGame = () => {
    setPlayerY(canvasSize.height / 2 - PLAYER_HEIGHT / 2);
    setGameOver(false);
    setGameWin(false);
    setIsPlaying(true);
    setShowForm(false);
    setExplosions([]);
    setLives(3);
    setScore(0);
    setCurrentQuestionIndex(0);
    setShowResult(false);
    setIsInvincible(false);
    setInvincibleTimer(0);
    setGameSpeed(1);
    setBaseGameSpeed(2);
    setAnsweredCorrectCount(0);
    setIsPaused(false);
    cloudsRef.current = [];
    cloudSubPixelXRef.current.clear();
    backgroundXRef.current = 0;
    
    if (invincibleTimeoutRef.current) {
      clearTimeout(invincibleTimeoutRef.current);
      invincibleTimeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  };

  // Hàm quay lại form (chỉ dùng khi nhấn "Edit Questions")
  const backToForm = () => {
    setIsPlaying(false);
    setShowForm(true);
    setGameOver(false);
    setGameWin(false);
    cloudsRef.current = [];
  };

  // Hàm thay đổi tốc độ
  const changeSpeed = (speed: number) => {
    setGameSpeed(speed);
    setIsPaused(false);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const increaseSpeed = () => {
    const currentIndex = speedLevels.indexOf(gameSpeed);
    const nextIndex = (currentIndex + 1) % speedLevels.length;
    const newSpeed = speedLevels[nextIndex];
    changeSpeed(newSpeed);
  };

  const decreaseSpeed = () => {
    const currentIndex = speedLevels.indexOf(gameSpeed);
    const prevIndex = (currentIndex - 1 + speedLevels.length) % speedLevels.length;
    const newSpeed = speedLevels[prevIndex];
    changeSpeed(newSpeed);
  };

  // Kích hoạt iframe (bất tử)
  const activateInvincibility = (duration: number = 2000) => {
    setIsInvincible(true);
    setInvincibleTimer(duration / 1000);
    
    if (invincibleTimeoutRef.current) {
      clearTimeout(invincibleTimeoutRef.current);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    
    const startTime = Date.now();
    const updateTimer = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, Math.ceil((duration - elapsed) / 1000));
      setInvincibleTimer(remaining);
      
      if (remaining <= 0) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
    
    countdownIntervalRef.current = setInterval(updateTimer, 100);
    
    invincibleTimeoutRef.current = setTimeout(() => {
      setIsInvincible(false);
      setInvincibleTimer(0);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    }, duration);
  };

  const createCloud = useCallback((answer: string) => {
    const tiers = [
      canvasSize.height * 0.12,
      canvasSize.height * 0.24,
      canvasSize.height * 0.36,
      canvasSize.height * 0.48,
      canvasSize.height * 0.60,
      canvasSize.height * 0.72,
      canvasSize.height * 0.84
    ];
    
    const currentClouds = cloudsRef.current;
    if (currentClouds.length >= MAX_CLOUDS) {
      return null;
    }
    
    const usedTiers = currentClouds.map(cloud => {
      return tiers.reduce((prev, curr) => {
        return Math.abs(curr - cloud.y) < Math.abs(prev - cloud.y) ? curr : prev;
      });
    });
    
    const availableTiers = tiers.filter(tier => 
      !usedTiers.some(usedTier => Math.abs(usedTier - tier) < 50)
    );
    
    let newY;
    
    if (availableTiers.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableTiers.length);
      newY = availableTiers[randomIndex];
    } else {
      const tierDistances = tiers.map(tier => {
        const minDist = Math.min(
          ...currentClouds.map(c => Math.abs(c.y - tier))
        );
        return { tier, dist: minDist };
      });
      
      tierDistances.sort((a, b) => b.dist - a.dist);
      newY = tierDistances[0].tier;
    }
    
    newY = Math.max(80, Math.min(canvasSize.height - 150, newY));
    
    return {
      id: nextIdRef.current++,
      x: canvasSize.width,
      y: newY,
      width: CLOUD_WIDTH,
      height: CLOUD_HEIGHT,
      answer: answer,
      speed: BASE_CLOUD_SPEED,
      isCorrect: null
    };
  }, [canvasSize.width, canvasSize.height, CLOUD_WIDTH, CLOUD_HEIGHT, BASE_CLOUD_SPEED, MAX_CLOUDS]);

  // Thêm câu hỏi mới từ form
  const addQuestion = () => {
    if (!newQuestion.question) {
      alert('Please enter a question!');
      return;
    }

    const answerTexts = [
      newQuestion.answer1,
      newQuestion.answer2,
      newQuestion.answer3,
      newQuestion.answer4,
      newQuestion.answer5,
      newQuestion.answer6,
      newQuestion.answer7
    ].filter(a => a.trim() !== '');

    if (answerTexts.length < 2) {
      alert('Please enter at least 2 answers!');
      return;
    }

    if (!newQuestion.correctAnswer) {
      alert('Please enter the correct answer!');
      return;
    }

    if (!answerTexts.includes(newQuestion.correctAnswer)) {
      alert('Correct answer must be one of the answers you entered!');
      return;
    }

    // Tạo mảng answers theo format mới
    const answers: Answer[] = answerTexts.map((text, index) => ({
      id: `${customQuestions.length + 1}_${index + 1}`,
      text: text,
      isCorrect: text === newQuestion.correctAnswer
    }));

    const newQ: Question = {
      id: String(customQuestions.length + 1),
      question: newQuestion.question,
      imagePath: null,
      answers: answers,
      multipleCorrect: false,
      _answerCounter: answers.length
    };

    setCustomQuestions([...customQuestions, newQ]);
    
    setNewQuestion({
      question: '',
      answer1: '',
      answer2: '',
      answer3: '',
      answer4: '',
      answer5: '',
      answer6: '',
      answer7: '',
      correctAnswer: ''
    });
  };

  // Xóa câu hỏi
  const removeQuestion = (id: string) => {
    setCustomQuestions(customQuestions.filter(q => q.id !== id));
  };

  // Sử dụng câu hỏi mẫu
  const useSampleQuestions = () => {
    setCustomQuestions(sampleQuestions);
  };

  // Load images
  useEffect(() => {
    backgroundImage.current.src = './images/background.jpg';
    playerImage.current.src = './images/plane.png';
    cloudImage.current.src = './images/cloud.png';
    tickImage.current.src = './images/tick.png';
    crossImage.current.src = './images/cross.png';
    explosionImage.current.src = './images/explosion.png';

    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key] = true;
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'w' || e.key === 's' || e.key === 'W' || e.key === 'S') {
        e.preventDefault();
      }
      if (e.code === 'Space') {
        e.preventDefault();
        togglePause();
      }
      if (e.key === '1') {
        e.preventDefault();
        changeSpeed(1);
      }
      if (e.key === '2') {
        e.preventDefault();
        changeSpeed(2);
      }
      if (e.key === '3') {
        e.preventDefault();
        changeSpeed(4);
      }
      if (e.key === '4') {
        e.preventDefault();
        changeSpeed(6);
      }
      if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        increaseSpeed();
      }
      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        decreaseSpeed();
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key] = false;
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'w' || e.key === 's' || e.key === 'W' || e.key === 'S') {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (explosionAnimationRef.current) cancelAnimationFrame(explosionAnimationRef.current);
      if (invincibleTimeoutRef.current) clearTimeout(invincibleTimeoutRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  // Cập nhật kích thước canvas
  useEffect(() => {
    const updateCanvasSize = () => {
      setCanvasSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  // Animation cho vụ nổ
  useEffect(() => {
    const animateExplosions = () => {
      setExplosions(prev => 
        prev
          .map(exp => ({
            ...exp,
            frame: exp.frame + 1
          }))
          .filter(exp => exp.frame < 10)
      );
      
      explosionAnimationRef.current = requestAnimationFrame(animateExplosions);
    };

    explosionAnimationRef.current = requestAnimationFrame(animateExplosions);
    return () => {
      if (explosionAnimationRef.current) {
        cancelAnimationFrame(explosionAnimationRef.current);
      }
    };
  }, []);

  const createExplosion = (x: number, y: number, width: number, height: number) => {
    const newExplosion: Explosion = {
      x: x - width * 0.25,
      y: y - height * 0.25,
      width: width * 1.5,
      height: height * 1.5,
      frame: 0,
      id: nextIdRef.current++
    };
    setExplosions(prev => [...prev, newExplosion]);
  };

  // Lấy danh sách đáp án dạng text
  const getAnswerTexts = (question: Question): string[] => {
    return question.answers.map(a => a.text);
  };

  // Xử lý khi chọn đáp án
  const handleAnswer = useCallback((cloud: Cloud) => {
    if (!currentQuestion) return;
    if (isInvincible) return;

    // Kiểm tra đáp án đúng
    const isCorrect = currentQuestion.answers.some(a => a.text === cloud.answer && a.isCorrect);
    
    cloudsRef.current = cloudsRef.current.map(c => {
      if (c.id === cloud.id) {
        return { ...c, isCorrect };
      }
      return c;
    });

    activateInvincibility(2000);

    if (isCorrect) {
      setScore(prev => prev + 10);
      setResultMessage('Correct! +10 points');
      setResultType('success');
      setShowResult(true);
      
      // Tăng số câu trả lời đúng
      const newCorrectCount = answeredCorrectCount + 1;
      setAnsweredCorrectCount(newCorrectCount);
      
      // Tính tốc độ mới: bắt đầu từ 1, tăng dần đến 6 ở câu cuối
      // Công thức: speed = 1 + (5 * (số câu đã đúng / tổng số câu))
      const maxSpeed = 8;
      const minSpeed = 2;
      const progress = newCorrectCount / totalQuestions;
      const newSpeed = minSpeed + (maxSpeed - minSpeed) * progress;
      const finalSpeed = Math.min(maxSpeed, Math.max(minSpeed, newSpeed));
      setBaseGameSpeed(finalSpeed);
      
      createExplosion(cloud.x, cloud.y, cloud.width, cloud.height);
      
      setTimeout(() => {
        cloudsRef.current = [];
        setShowResult(false);
        
        if (currentQuestionIndex + 1 >= questions.length) {
          setGameWin(true);
          setIsPlaying(false);
        } else {
          setCurrentQuestionIndex(prev => prev + 1);
        }
      }, 1500);
      
    } else {
      setLives(prev => {
        const newLives = prev - 1;
        if (newLives <= 0) {
          setTimeout(() => {
            setGameOver(true);
            setIsPlaying(false);
          }, 500);
        }
        return newLives;
      });
      
      setResultMessage(`Wrong! ${lives - 1} live(s) left`);
      setResultType('error');
      setShowResult(true);
      
      createExplosion(cloud.x, cloud.y, cloud.width, cloud.height);
      
      setTimeout(() => {
        cloudsRef.current = cloudsRef.current.filter(c => c.id !== cloud.id);
        setShowResult(false);
      }, 1000);
    }
  }, [currentQuestion, lives, currentQuestionIndex, isInvincible, questions.length, answeredCorrectCount, totalQuestions]);

  const updatePlayer = useCallback(() => {
    let newY = playerY;
    const maxY = canvasSize.height - PLAYER_HEIGHT;
    
    // Kiểm tra cả phím mũi tên và W/S
    const isUpPressed = keysRef.current['ArrowUp'] || keysRef.current['w'] || keysRef.current['W'];
    const isDownPressed = keysRef.current['ArrowDown'] || keysRef.current['s'] || keysRef.current['S'];
    
    if (isUpPressed && playerY > 0) {
      newY = playerY - PLAYER_SPEED;
    }
    if (isDownPressed && playerY < maxY) {
      newY = playerY + PLAYER_SPEED;
    }
    
    setPlayerY(Math.max(0, Math.min(maxY, newY)));
  }, [playerY, canvasSize.height, PLAYER_HEIGHT, PLAYER_SPEED]);

  const updateGame = useCallback(() => {
  if (!isPlaying || gameOver || gameWin || isPaused) return;

  updatePlayer();

  // Sử dụng baseGameSpeed (tăng dần) cho tốc độ game
  const currentGameSpeed = baseGameSpeed;
  const currentBackgroundSpeed = BASE_BACKGROUND_SPEED * currentGameSpeed;
  const currentCloudSpeed = BASE_CLOUD_SPEED * currentGameSpeed;
  
  backgroundXRef.current -= currentBackgroundSpeed;
  if (backgroundXRef.current <= -canvasSize.width) {
    backgroundXRef.current = 0;
  }

  if (currentQuestion && cloudsRef.current.length < MAX_CLOUDS && !gameWin) {
    const existingAnswers = cloudsRef.current.map(c => c.answer);
    const answerTexts = getAnswerTexts(currentQuestion);
    const availableAnswers = answerTexts.filter(a => !existingAnswers.includes(a));
    
    const spawnChance = 0.015 * Math.min(currentGameSpeed, 3);
    if (availableAnswers.length > 0 && Math.random() < spawnChance) {
      const randomIndex = Math.floor(Math.random() * availableAnswers.length);
      const newCloud = createCloud(availableAnswers[randomIndex]);
      
      if (newCloud) {
        const tooClose = cloudsRef.current.some(c => 
          Math.abs(c.y - newCloud.y) < CLOUD_HEIGHT * 1.2
        );
        
        if (!tooClose) {
          cloudsRef.current = [...cloudsRef.current, newCloud];
          // Khởi tạo sub-pixel cho mây mới
          cloudSubPixelXRef.current.set(newCloud.id, newCloud.x);
        }
      }
    }
  }

  if (!isInvincible) {
    const playerHitboxY = playerY + (PLAYER_HEIGHT - PLAYER_HITBOX_HEIGHT) / 2;
    
    cloudsRef.current = cloudsRef.current
      .map(cloud => {
        // Lấy vị trí sub-pixel hiện tại, nếu chưa có thì dùng cloud.x
        let subX = cloudSubPixelXRef.current.get(cloud.id) ?? cloud.x;
        subX -= currentCloudSpeed;
        // Lưu lại vị trí sub-pixel
        cloudSubPixelXRef.current.set(cloud.id, subX);
        return { ...cloud, x: subX };
      })
      .filter(cloud => {
        if (cloud.x + cloud.width < 0) {
          // Xóa sub-pixel khi xóa mây
          cloudSubPixelXRef.current.delete(cloud.id);
          return false;
        }
        
        if (cloud.isCorrect === null) {
          // Vẫn dùng cloud.x (giá trị sub-pixel) để tính va chạm
          const cloudHitboxWidth = cloud.width * HITBOX_SCALE;
          const cloudHitboxHeight = cloud.height * HITBOX_SCALE;
          const cloudHitboxX = cloud.x + (cloud.width - cloudHitboxWidth) / 2;
          const cloudHitboxY = cloud.y + (cloud.height - cloudHitboxHeight) / 2;
          
          const collision = (
            PLAYER_HITBOX_X < cloudHitboxX + cloudHitboxWidth &&
            PLAYER_HITBOX_X + PLAYER_HITBOX_WIDTH > cloudHitboxX &&
            playerHitboxY < cloudHitboxY + cloudHitboxHeight &&
            playerHitboxY + PLAYER_HITBOX_HEIGHT > cloudHitboxY
          );

          if (collision) {
            handleAnswer(cloud);
          }
        }
        
        return true;
      });
  } else {
    cloudsRef.current = cloudsRef.current
      .map(cloud => {
        let subX = cloudSubPixelXRef.current.get(cloud.id) ?? cloud.x;
        subX -= currentCloudSpeed;
        cloudSubPixelXRef.current.set(cloud.id, subX);
        return { ...cloud, x: subX };
      })
      .filter(cloud => {
        if (cloud.x + cloud.width < 0) {
          cloudSubPixelXRef.current.delete(cloud.id);
          return false;
        }
        return true;
      });
  }

  animationRef.current = requestAnimationFrame(updateGame);
}, [isPlaying, gameOver, gameWin, playerY, currentQuestion, updatePlayer, handleAnswer, createCloud, canvasSize.width, canvasSize.height, isInvincible, baseGameSpeed, isPaused]);

  useEffect(() => {
    if (isPlaying && !gameOver && !gameWin) {
      animationRef.current = requestAnimationFrame(updateGame);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, gameOver, gameWin, updateGame]);

  // Drawing
  useEffect(() => {
    if (!isPlaying && !gameOver && !gameWin) return;

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (backgroundImage.current.complete) {
        ctx.drawImage(backgroundImage.current, backgroundXRef.current, 0, canvas.width, canvas.height);
        ctx.drawImage(backgroundImage.current, backgroundXRef.current + canvas.width, 0, canvas.width, canvas.height);
      }

      if (cloudImage.current.complete) {
  cloudsRef.current.forEach(cloud => {
    if (cloud.isCorrect !== null) ctx.globalAlpha = 0.6;
    
    // Làm tròn tọa độ X để vẽ mượt hơn
    const drawX = Math.round(cloud.x);
    ctx.drawImage(cloudImage.current, drawX, cloud.y, cloud.width, cloud.height);
    
    // Font chữ đậm và to hơn
    ctx.font = `bold ${Math.min(28, cloud.height * 0.45)}px "Segoe UI", "Arial", sans-serif`;
    ctx.fillStyle = cloud.isCorrect !== null ? '#555' : '#111';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Thêm shadow cho chữ
    ctx.shadowBlur = 2;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.fillText(cloud.answer, drawX + cloud.width / 2, cloud.y + cloud.height / 2);
    ctx.shadowBlur = 0;

    if (cloud.isCorrect !== null) {
      const iconSize = cloud.height * 0.4;
      if (cloud.isCorrect && tickImage.current.complete) {
        ctx.drawImage(tickImage.current, drawX + cloud.width - iconSize, cloud.y, iconSize, iconSize);
      } else if (cloud.isCorrect === false && crossImage.current.complete) {
        ctx.drawImage(crossImage.current, drawX + cloud.width - iconSize, cloud.y, iconSize, iconSize);
      }
    }
    
    ctx.globalAlpha = 1;
  });
}

      if (playerImage.current.complete && !gameOver && !gameWin) {
        if (isInvincible) {
          const shouldDraw = Math.floor(Date.now() / 100) % 2 === 0;
          if (shouldDraw) {
            ctx.globalAlpha = 0.5;
            ctx.drawImage(playerImage.current, PLAYER_X, playerY, PLAYER_WIDTH, PLAYER_HEIGHT);
            ctx.globalAlpha = 1;
          }
        } else {
          ctx.drawImage(playerImage.current, PLAYER_X, playerY, PLAYER_WIDTH, PLAYER_HEIGHT);
        }
      }

      if (explosionImage.current.complete) {
        explosions.forEach(exp => {
          ctx.globalAlpha = 1 - (exp.frame / 10);
          ctx.drawImage(explosionImage.current, exp.x, exp.y, exp.width, exp.height);
        });
        ctx.globalAlpha = 1;
      }

      if (currentQuestion && !gameWin) {
        ctx.font = `bold ${Math.min(32, canvasSize.height * 0.05)}px Arial`;
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.textAlign = 'center';
        ctx.strokeText(currentQuestion.question, canvas.width / 2, 60);
        ctx.fillText(currentQuestion.question, canvas.width / 2, 60);
      }

      ctx.font = `${Math.min(24, canvasSize.height * 0.04)}px Arial`;
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      
      ctx.strokeText(`Score: ${score}`, 100, 50);
      ctx.fillText(`Score: ${score}`, 100, 50);
      
      for (let i = 0; i < lives; i++) {
        ctx.fillStyle = '#ff4444';
        ctx.font = '30px Arial';
        ctx.fillText('❤️', canvas.width - 150 + i * 35, 50);
      }

      ctx.font = `${Math.min(20, canvasSize.height * 0.03)}px Arial`;
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.strokeText(`Question ${currentQuestionIndex + 1}/${questions.length}`, canvas.width / 2, 100);
      ctx.fillText(`Question ${currentQuestionIndex + 1}/${questions.length}`, canvas.width / 2, 100);
      
      // Hiển thị tốc độ hiện tại
      ctx.font = `${Math.min(20, canvasSize.height * 0.03)}px Arial`;
      ctx.fillStyle = '#ffd700';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.strokeText(`Speed: ${baseGameSpeed.toFixed(1)}x`, canvas.width - 150, 100);
      ctx.fillText(`Speed: ${baseGameSpeed.toFixed(1)}x`, canvas.width - 150, 100);
      
      // Vẽ thanh tiến trình tốc độ
      const speedPercent = (baseGameSpeed - 1) / 5; // 1 -> 0%, 6 -> 100%
      const barWidth = 130;
      const barHeight = 6;
      const barX = canvas.width - 150;
      const barY = 115;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(barX, barY, barWidth, barHeight);
      ctx.fillStyle = '#4CAF50';
      ctx.fillRect(barX, barY, barWidth * Math.min(1, Math.max(0, speedPercent)), barHeight);

      if (isInvincible && invincibleTimer > 0) {
        ctx.font = `bold ${Math.min(24, canvasSize.height * 0.04)}px Arial`;
        ctx.fillStyle = '#ffd700';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.strokeText(`Invincible: ${invincibleTimer}s`, canvas.width / 2, 150);
        ctx.fillText(`Invincible: ${invincibleTimer}s`, canvas.width / 2, 150);
      }

      if (showResult && resultMessage) {
        ctx.font = `bold ${Math.min(28, canvasSize.height * 0.045)}px Arial`;
        ctx.fillStyle = resultType === 'success' ? '#4CAF50' : '#ff4444';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.strokeText(resultMessage, canvas.width / 2, 200);
        ctx.fillText(resultMessage, canvas.width / 2, 200);
      }
    };

    const interval = setInterval(draw, 1);
    return () => clearInterval(interval);
  }, [isPlaying, gameOver, gameWin, playerY, canvasSize, explosions, currentQuestion, score, lives, showResult, resultMessage, resultType, currentQuestionIndex, isInvincible, invincibleTimer, questions.length, baseGameSpeed]);

  // Tự động bắt đầu game khi component được load
  useEffect(() => {
    const timer = setTimeout(() => {
      resetGame();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div ref={containerRef} className="game-container">
      <canvas ref={canvasRef} width={canvasSize.width} height={canvasSize.height} className="game-canvas" />
      
      {/* Speed Control Panel - only show when playing */}
      {isPlaying && !gameOver && !gameWin && (
        <div className="speed-control">
          <button 
            className={`speed-btn ${isPaused ? 'active' : ''}`} 
            onClick={togglePause}
            title="Pause"
          >
            ⏸️
          </button>
          <button 
            className={`speed-btn ${gameSpeed === 1 && !isPaused ? 'active' : ''}`} 
            onClick={() => changeSpeed(1)}
            title="Normal Speed"
          >
            x1
          </button>
          <button 
            className={`speed-btn ${gameSpeed === 2 ? 'active' : ''}`} 
            onClick={() => changeSpeed(2)}
            title="2x Speed"
          >
            x2
          </button>
          <button 
            className={`speed-btn ${gameSpeed === 4 ? 'active' : ''}`} 
            onClick={() => changeSpeed(4)}
            title="4x Speed"
          >
            x4
          </button>
          <button 
            className={`speed-btn ${gameSpeed === 6 ? 'active' : ''}`} 
            onClick={() => changeSpeed(6)}
            title="6x Speed"
          >
            x6
          </button>
        </div>
      )}
      
      {/* Form nhập câu hỏi - chỉ hiện khi nhấn Edit Questions */}
      {showForm && (
        <div className="form-container">
          <h1>📝 PLANE-GAME: QUESTIONS HUB</h1>
          
          <div className="form-section">
            <h2>Add New Question</h2>
            
            <input
              type="text"
              placeholder="Enter your question..."
              value={newQuestion.question}
              onChange={(e) => setNewQuestion({...newQuestion, question: e.target.value})}
              className="form-input"
            />
            
            <div className="answers-grid">
              <input
                type="text"
                placeholder="Answer 1"
                value={newQuestion.answer1}
                onChange={(e) => setNewQuestion({...newQuestion, answer1: e.target.value})}
                className="form-input"
              />
              <input
                type="text"
                placeholder="Answer 2"
                value={newQuestion.answer2}
                onChange={(e) => setNewQuestion({...newQuestion, answer2: e.target.value})}
                className="form-input"
              />
              <input
                type="text"
                placeholder="Answer 3"
                value={newQuestion.answer3}
                onChange={(e) => setNewQuestion({...newQuestion, answer3: e.target.value})}
                className="form-input"
              />
              <input
                type="text"
                placeholder="Answer 4"
                value={newQuestion.answer4}
                onChange={(e) => setNewQuestion({...newQuestion, answer4: e.target.value})}
                className="form-input"
              />
              <input
                type="text"
                placeholder="Answer 5"
                value={newQuestion.answer5}
                onChange={(e) => setNewQuestion({...newQuestion, answer5: e.target.value})}
                className="form-input"
              />
              <input
                type="text"
                placeholder="Answer 6"
                value={newQuestion.answer6}
                onChange={(e) => setNewQuestion({...newQuestion, answer6: e.target.value})}
                className="form-input"
              />
              <input
                type="text"
                placeholder="Answer 7"
                value={newQuestion.answer7}
                onChange={(e) => setNewQuestion({...newQuestion, answer7: e.target.value})}
                className="form-input"
              />
            </div>
            
            <input
              type="text"
              placeholder="Correct answer (must match exactly)"
              value={newQuestion.correctAnswer}
              onChange={(e) => setNewQuestion({...newQuestion, correctAnswer: e.target.value})}
              className="form-input"
            />
            
            <button onClick={addQuestion} className="form-button add-button">
              ➕ Add Question
            </button>
          </div>
          
          {customQuestions.length > 0 && (
            <div className="form-section">
              <h2>Your Questions ({customQuestions.length})</h2>
              <div className="questions-list">
                {customQuestions.map((q, index) => (
                  <div key={q.id} className="question-item">
                    <div className="question-text">
                      <strong>Q{index + 1}:</strong> {q.question}
                    </div>
                    <div className="question-answers">
                      {q.answers.map((a, i) => (
                        <span key={i} className={a.isCorrect ? 'correct-answer' : ''}>
                          {a.text}
                        </span>
                      ))}
                    </div>
                    <button onClick={() => removeQuestion(q.id)} className="remove-button">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="form-buttons">
            <button onClick={useSampleQuestions} className="sample-button">
              📋 Use Sample Questions
            </button>
            
            <button onClick={resetGame} className="play-button">
              🎮 START GAME ({customQuestions.length} questions)
            </button>
          </div>
        </div>
      )}
      
      {/* Menu tạm dừng - chỉ hiện khi không chơi, không game over, không win */}
      {!showForm && !isPlaying && !gameOver && !gameWin && (
        <div className="menu">
          <h1>✈️ Plane-Game</h1>
          <button onClick={resetGame} className="start-button">Play Again</button>
          <button onClick={backToForm} className="back-button">← Edit Questions</button>
          <div className="controls">
            <p>Use ↑ / W to move up</p>
            <p>Use ↓ / S to move down</p>
            <p>Hit the clouds to select an answer</p>
            <p>❤️ You have 3 lives</p>
            <p>✅ Answer correctly to proceed</p>
            <p>⚡ Speed increases with each correct answer!</p>
            <p>⌨️ Shortcuts: Space (Pause/Resume), A/D (Speed override)</p>
          </div>
        </div>
      )}
      
      {/* Màn hình Win */}
      {gameWin && (
        <div className="menu win-menu">
          <h1>🏆 WINNER! 🏆</h1>
          <p className="final-score">Score: {score}</p>
          <p className="final-score">Correct: {questions.length}/{questions.length}</p>
          <button onClick={resetGame} className="win-button">Play Again</button>
        </div>
      )}
      
      {/* Màn hình Game Over */}
      {gameOver && (
        <div className="menu">
          <h2>Game Over!</h2>
          <p className="final-score">Score: {score}</p>
          <p className="final-score">Progress: {currentQuestionIndex}/{questions.length}</p>
          <button onClick={resetGame} className="restart-button">Play Again</button>
        </div>
      )}
    </div>
  );
};

export default Game;