import { useEffect, useRef, useState } from "react";
import Hole from "./Hole";
import type { Question, Answer, RoundAnswer } from "../type";

const TOTAL = 10;

type Props = {
  currentIndex: number,
  question: Question;
  answerPool: Answer[];
  onCorrect: () => void;
  isPlaying: boolean
};

export default function GamePage({
  currentIndex,
  question,
  answerPool,
  onCorrect,
  isPlaying
}: Props) {
  const [activeIndexes, setActiveIndexes] = useState<number[]>([]);
  const [goingDown, setGoingDown] = useState<number[]>([]);
  const [holeData, setHoleData] = useState<Record<number, RoundAnswer>>({});
  const [hitState, setHitState] = useState<Record<number, "correct" | "wrong">>({});
  const hasCorrectInCycle = useRef(false);

  const prevIndexes = useRef<number[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 👉 thêm cho 3 lượt
  const roundRef = useRef(0);
  const mustHaveCorrectRound = useRef(
    Math.floor(Math.random() * 3) + 1
  );

  const clearTimeoutRef = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  useEffect(() => {
    if (!isPlaying) return
    // spawnMoles();
    autoHideMoles(activeIndexes)
    return () => {
      clearTimeoutRef()
    };
  }, [isPlaying]);

  const generateAnswers = (count: number, forceCorrect = false): RoundAnswer[] => {
    const correct: RoundAnswer = {
      groupId: question.groupId,
      text: question.answerText,
      image: question.answerImage,
      correct: true
    };

    const otherPool = answerPool.filter(
      a => a.groupId !== question.groupId
    );

    const result: RoundAnswer[] = [];
    const used = new Set<string>();

    const getKey = (a: RoundAnswer) => `${a.text}||${a.image}`;

    if (forceCorrect) {
      result.push(correct);
      used.add(getKey(correct));
    }

    while (result.length < count) {
      let candidate: RoundAnswer | null = null;

      const type = Math.random();

      if (type < 0.33) {
        // cặp đúng của câu khác
        const pick = otherPool[Math.floor(Math.random() * otherPool.length)];
        if (pick) {
          candidate = { ...pick, correct: false };
        }
      } else if (type < 0.66) {
        // mix: text đúng + image khác
        const pick = otherPool[Math.floor(Math.random() * otherPool.length)];
        if (pick) {
          candidate = {
            text: correct.text,
            image: pick.image,
            groupId: 0,
            correct: false
          };
        }
      } else {
        // mix: image đúng + text khác
        const pick = otherPool[Math.floor(Math.random() * otherPool.length)];
        if (pick) {
          candidate = {
            text: pick.text,
            image: correct.image,
            groupId: 0,
            correct: false
          };
        }
      }

      if (!candidate) continue;

      const key = getKey(candidate);

      // ❗ CHỐT: đảm bảo UNIQUE
      if (used.has(key)) continue;

      used.add(key);
      result.push(candidate);
    }

    return result.sort(() => Math.random() - 0.5);
  };

  const spawnMoles = () => {
    clearTimeoutRef()

    roundRef.current += 1;

    const count = Math.max(2, Math.floor(Math.random() * 3) + 1);

    const all = Array.from({ length: TOTAL }, (_, i) => i + 1);

    let shuffled = [...all].sort(() => Math.random() - 0.5);
    let next = shuffled.slice(0, count);

    next = next.filter(i => !prevIndexes.current.includes(i));

    if (next.length === 0) {
      shuffled = [...all].sort(() => Math.random() - 0.5);
      next = shuffled.slice(0, count);
    }

    prevIndexes.current = [...next];

    // 👉 xác định có correct hay không
    const forceCorrect =
      roundRef.current === mustHaveCorrectRound.current;

    const answers = generateAnswers(next.length, forceCorrect);

    if (answers.some(a => a.correct)) {
      hasCorrectInCycle.current = true;
    }

    const mapping: Record<number, RoundAnswer> = {};
    next.forEach((index, i) => {
      mapping[index] = answers[i];
    });

    setHoleData(mapping);
    setActiveIndexes(next);
    setHitState({});

    const ROUND_TIME = Math.random() * 1000 + 2500;

    timeoutRef.current = setTimeout(() => {
      autoHideMoles(next);
    }, ROUND_TIME);
  };

  const autoHideMoles = (indexes: number[]) => {
    setGoingDown([...indexes]);
    setActiveIndexes([]);

    // 👉 chỉ reset khi:
    // - đã có correct
    // - và đã đủ 3 lượt
    if (hasCorrectInCycle.current && roundRef.current >= 3) {
      roundRef.current = 0;
      hasCorrectInCycle.current = false;

      mustHaveCorrectRound.current = Math.floor(Math.random() * 3) + 1;
    }

    spawnMoles();
  };

  const handleWhack = (index: number) => {
    if (!isPlaying) return;
    const answer = holeData[index];
    if (!answer) return;

    const result = answer.correct ? "correct" : "wrong";

    // 👉 lưu trạng thái hit
    setHitState(prev => ({
      ...prev,
      [index]: result
    }));

    if (answer.correct) {
      setGoingDown(prev => [...prev, ...activeIndexes, index])
      setActiveIndexes([])
      clearTimeoutRef()
      setTimeout(() => {
        onCorrect();
      }, 5000);
    } else {
      setGoingDown(prev => [...prev, index]);
      setActiveIndexes(prev => prev.filter(i => i !== index));
    }
  };

  useEffect(() => {
    if (activeIndexes.length === 0) {
      // spawnMoles();
    }
  }, [activeIndexes]);

  return (
    <div className="page">
      <div className="sign-box">
        {/* <img src="/assets/wood.svg" alt="" />
         */}
        <div className="sign-box-wood"></div>
        <div className="container">
          <div className="sign-text">{currentIndex + 1 + ". " + question.question}</div>
          <img className="question-img" src={question.questionImage} alt="" />
        </div>
      </div>

      <main>
        <div className="row row-3">
          {[1, 2, 3].map(i => (
            <Hole
              key={i}
              index={i}
              active={activeIndexes.includes(i)}
              goingDown={goingDown.includes(i)}
              data={holeData[i]}
              hitState={hitState[i]}

              onClick={handleWhack}
            />
          ))}
        </div>

        <div className="row row-4">
          {[4, 5, 6, 7].map(i => (
            <Hole
              key={i}
              index={i}
              active={activeIndexes.includes(i)}
              goingDown={goingDown.includes(i)}
              data={holeData[i]}
              hitState={hitState[i]}
              onClick={handleWhack}
            />
          ))}
        </div>

        <div className="row row-3">
          {[8, 9, 10].map(i => (
            <Hole
              key={i}
              index={i}
              active={activeIndexes.includes(i)}
              goingDown={goingDown.includes(i)}
              data={holeData[i]}
              hitState={hitState[i]}
              onClick={handleWhack}
            />
          ))}
        </div>
      </main>
    </div>
  );
}