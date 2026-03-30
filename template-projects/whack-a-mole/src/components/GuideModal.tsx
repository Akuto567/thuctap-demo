import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type Props = {
    open: boolean;
    onClose: () => void;
};

const pages = [
    {
        text: "Cặp đáp án chính xác",
        image: "./images/guide-1.png"
    },
    {
        text: "Nổi giận",
        image: "./images/guide-2.png"
    },
    {
        text: "Bắt được rồi",
        image: "./images/guide-3.png"
    }
];

export default function GuideModal({ open, onClose }: Props) {
    const [page, setPage] = useState(0);

    if (!open) return null;

    return (
        <div className="modal-overlay">
            <div className="guide-modal">
                
                {/* close icon */}
                <button className="icon-btn close-btn" onClick={() => { onClose(); setPage(0); }}>
                    <X />
                </button>

                <p className="guide-text">{pages[page].text}</p>

                <div className="guide-content">
                    <button
                        className="icon-btn"
                        disabled={page === 0}
                        onClick={() => setPage(p => p - 1)}
                    >
                        <ChevronLeft />
                    </button>

                    <img
                        src={pages[page].image}
                        alt="guide"
                        className="guide-img"
                    />

                    <button
                        className="icon-btn"
                        disabled={page === pages.length - 1}
                        onClick={() => setPage(p => p + 1)}
                    >
                        <ChevronRight />
                    </button>
                </div>

                {/* indicator */}
                <div className="dots">
                    {pages.map((_, i) => (
                        <span key={i} className={i === page ? "dot active" : "dot"} />
                    ))}
                </div>

            </div>
        </div>
    );
}