import React, { useState, useRef, useLayoutEffect, useCallback } from "react";
import { motion } from "framer-motion";
import "./ReviewCardsStack.css";

/**
 * ReviewCardsStack
 * ------------------------------------------------------------------
 * Phase 1: cards enter as a single overlapped "messy stack" when the
 *          section scrolls into view (fade + scale, once).
 * Phase 2: hovering anywhere over the stack fans the cards out into
 *          their real grid positions, staggered top-of-stack first,
 *          spring eased.
 * Phase 3: once unpacked, cards stay unpacked (no re-stack on mouse
 *          leave) — see UNSTACK_ON_LEAVE flag below if you want the
 *          optional re-stack-if-not-scrolled-past behavior instead.
 *
 * Usage:
 *   <ReviewCardsStack reviews={reviews} />
 *
 *   reviews: Array<{ id, name, rating (1-5), text, date?, avatar? }>
 * ------------------------------------------------------------------
 */

// Hardcoded per-card "messy stack" look — consistent every load.
// Add/remove entries if you have more/fewer than 5 cards; extra cards
// beyond this array fall back to a generated-but-fixed pattern.
const STACK_LOOK = [
  { rotate: -6, scale: 0.97, z: 1 },
  { rotate: 3, scale: 0.98, z: 2 },
  { rotate: -2, scale: 0.99, z: 3 },
  { rotate: 8, scale: 0.96, z: 4 },
  { rotate: -4, scale: 1.0, z: 5 },
];

// Small fixed "peek" offsets so edges show behind one another (px),
// applied on top of the centering offset computed at runtime.
const PEEK_OFFSET = [
  { x: -10, y: 6 },
  { x: 8, y: -8 },
  { x: -6, y: -4 },
  { x: 10, y: 8 },
  { x: -4, y: 2 },
];

function getStackLook(i) {
  return STACK_LOOK[i % STACK_LOOK.length];
}
function getPeekOffset(i) {
  return PEEK_OFFSET[i % PEEK_OFFSET.length];
}

// Set true if you want cards to re-stack on hover-out (only while the
// section is still in view, so it never yanks content the user is
// mid-read on). False keeps them unpacked permanently — recommended.
const UNSTACK_ON_LEAVE = true;

function Star({ filled, delay }) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      className={`rcs-star ${filled ? "rcs-star--filled" : ""}`}
      initial={{ scale: 0, rotate: -45, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{
        type: "spring",
        stiffness: 320,
        damping: 14,
        delay,
      }}
    >
      <path
        d="M12 2.5l2.9 6.1 6.6.7-5 4.6 1.4 6.6-5.9-3.5-5.9 3.5 1.4-6.6-5-4.6 6.6-.7z"
        fill="currentColor"
      />
    </motion.svg>
  );
}

function Stars({ rating, active }) {
  return (
    <div className="rcs-stars" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) =>
        active ? (
          <Star key={i} filled={i < rating} delay={i * 0.06} />
        ) : (
          // Invisible placeholder keeps layout height stable before
          // the pop-in fires, so nothing jumps when stars appear.
          <span key={i} className="rcs-star rcs-star--placeholder" />
        )
      )}
    </div>
  );
}

function ReviewCard({ index, review, offset, isUnpacked, unpackDelay, look }) {
  const [starsActive, setStarsActive] = useState(false);

  const stackedTransform = {
    opacity: 1,
    rotate: look.rotate,
    scale: look.scale,
    x: offset.x,
    y: offset.y,
    zIndex: look.z,
    transition: { duration: 0.3, ease: "easeOut" },
  };

  const unpackedTransform = {
    opacity: 1,
    rotate: 0,
    scale: 1,
    x: 0,
    y: 0,
    zIndex: 10 + index,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20,
      delay: unpackDelay,
    },
  };

  return (
    <motion.article
      className="rcs-card"
      animate={isUnpacked ? unpackedTransform : stackedTransform}
      onAnimationComplete={() => {
        // Stars fire only once the card has actually arrived at its
        // final, readable position — not while still overlapped.
        if (isUnpacked) setStarsActive(true);
        else if (!UNSTACK_ON_LEAVE) {
          /* stays as-is */
        } else {
          setStarsActive(false);
        }
      }}
    >
      <div className="rcs-card__header">
        {review.avatar ? (
          <img className="rcs-card__avatar" src={review.avatar} alt={`${review.name}'s avatar`} loading="lazy" />
        ) : (
          <div className="rcs-card__avatar rcs-card__avatar--fallback">
            {review.name?.[0] ?? "?"}
          </div>
        )}
        <div>
          <p className="rcs-card__name">{review.name}</p>
          {review.date && <p className="rcs-card__date">{review.date}</p>}
        </div>
      </div>

      <Stars rating={review.rating} active={starsActive} />

      <p className="rcs-card__text">{review.text}</p>
    </motion.article>
  );
}

const DEFAULT_REVIEWS = [
  {
    id: 1,
    name: "Aarav Mehta",
    rating: 5,
    text: "The E2EE notes are extremely secure. Finally, a note app where my research and startup ideas stay private. Seamless Razorpay upgrade!",
    date: "June 2026",
  },
  {
    id: 2,
    name: "Priya Sharma",
    rating: 5,
    text: "Swapping between Gemini 3.1 Pro and Claude inside the editor helps me structure my college project reports instantly. Super smooth!",
    date: "June 2026",
  },
  {
    id: 3,
    name: "Ishaan Verma",
    rating: 5,
    text: "Offline support works perfectly on the Delhi Metro. My notes sync seamlessly to the cloud as soon as I get network back.",
    date: "May 2026",
  },
  {
    id: 4,
    name: "Ananya Iyer",
    rating: 5,
    text: "The bento grid layout and dark-mode workspace is gorgeous. Very clean LaTeX support for my math formulas.",
    date: "May 2026",
  },
  {
    id: 5,
    name: "Rohan Das",
    rating: 5,
    text: "The 'Let's Talk' E2EE chat makes collaboration on college assignments incredibly secure. OrbitX is my daily driver now.",
    date: "April 2026",
  }
];

export default function ReviewCardsStack({ reviews = DEFAULT_REVIEWS, columns = 3 }) {
  const [isHovered, setIsHovered] = useState(false);
  const [stackOffsets, setStackOffsets] = useState(() =>
    reviews.map(() => ({ x: 0, y: 0 }))
  );

  const gridRef = useRef(null);
  const cardRefs = useRef([]);

  // Measures each card's resting (grid) position and computes the
  // translation needed to pull it visually to the cluster's center,
  // so the stacked phase looks "roughly centered" regardless of how
  // the responsive grid lays out.
  const measure = useCallback(() => {
    const gridEl = gridRef.current;
    if (!gridEl) return;
    const cards = cardRefs.current.filter(Boolean);
    if (cards.length === 0) return;

    const gridRect = gridEl.getBoundingClientRect();
    const centers = cards.map((el) => {
      const r = el.getBoundingClientRect();
      return {
        x: r.left + r.width / 2 - gridRect.left,
        y: r.top + r.height / 2 - gridRect.top,
      };
    });

    // Use the exact middle of the grid element as the cluster center
    const clusterCenter = {
      x: gridRect.width / 2,
      y: gridRect.height / 2,
    };

    const offsets = centers.map((c, i) => {
      const peek = getPeekOffset(i);
      return {
        x: clusterCenter.x - c.x + peek.x,
        y: clusterCenter.y - c.y + peek.y,
      };
    });

    setStackOffsets(offsets);
  }, []);

  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (gridRef.current) ro.observe(gridRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure, reviews.length]);

  // Unpack order: top-of-stack (highest z) moves first.
  const maxZ = Math.max(...reviews.map((_, i) => getStackLook(i).z));
  const unpackDelayFor = (i) => {
    const z = getStackLook(i).z;
    const orderFromTop = maxZ - z; // 0 = topmost
    return orderFromTop * 0.07;
  };

  return (
    <motion.div
      className="rcs-section"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={{
        hidden: { opacity: 0, scale: 0.9 },
        visible: {
          opacity: 1,
          scale: 1,
          transition: { duration: 0.4, ease: "easeOut" },
        },
      }}
    >
      <div
        className="rcs-hover-pad"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          if (UNSTACK_ON_LEAVE) setIsHovered(false);
        }}
      >
        <div
          ref={gridRef}
          className="rcs-grid"
          style={{ "--rcs-columns": columns }}
        >
          {reviews.map((review, i) => (
            <div
              key={review.id ?? i}
              ref={(el) => (cardRefs.current[i] = el)}
              className="rcs-grid-cell"
            >
              <ReviewCard
                index={i}
                review={review}
                offset={stackOffsets[i] ?? { x: 0, y: 0 }}
                isUnpacked={isHovered}
                unpackDelay={unpackDelayFor(i)}
                look={getStackLook(i)}
              />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}