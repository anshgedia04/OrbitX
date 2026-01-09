"use client";

import React, { useRef, useEffect } from "react";

interface StarBackgroundProps {
    density?: number;
    speed?: number;
}

export const StarBackground: React.FC<StarBackgroundProps> = ({
    density = 100,
    speed = 0.5,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;
        let stars: { x: number; y: number; radius: number; alpha: number; speed: number }[] = [];

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initStars();
        };

        const initStars = () => {
            stars = [];
            const numStars = Math.floor((canvas.width * canvas.height) / (10000 / density * 10)); // Adjust density logic
            for (let i = 0; i < numStars; i++) {
                stars.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    radius: Math.random() * 1.5,
                    alpha: Math.random(),
                    speed: (Math.random() * 0.5 + 0.1) * speed,
                });
            }
        };

        let shootingStar: { x: number; y: number; length: number; speed: number; opacity: number } | null = null;
        let shootingStarInterval = 0;

        const drawStars = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "transparent";

            // Draw static stars
            stars.forEach((star) => {
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha + Math.sin(Date.now() * 0.001 * star.speed) * 0.2})`; // Twinkle
                ctx.fill();

                star.y -= star.speed;
                if (star.y < 0) {
                    star.y = canvas.height;
                    star.x = Math.random() * canvas.width;
                }
            });

            // Handle shooting star
            shootingStarInterval++;
            if (shootingStarInterval > 150 && Math.random() > 0.99 && !shootingStar) {
                shootingStar = {
                    x: Math.random() * canvas.width,
                    y: Math.random() * (canvas.height / 2),
                    length: Math.random() * 80 + 20,
                    speed: Math.random() * 10 + 10,
                    opacity: 1
                };
                shootingStarInterval = 0;
            }

            if (shootingStar) {
                ctx.save();
                ctx.beginPath();
                ctx.strokeStyle = `rgba(255, 255, 255, ${shootingStar.opacity})`;
                ctx.lineWidth = 2;
                ctx.moveTo(shootingStar.x, shootingStar.y);
                ctx.lineTo(shootingStar.x - shootingStar.length, shootingStar.y + shootingStar.length); // Diagonal left-down
                ctx.stroke();
                ctx.restore();

                shootingStar.x -= shootingStar.speed;
                shootingStar.y += shootingStar.speed;
                shootingStar.opacity -= 0.02;

                if (shootingStar.opacity <= 0 || shootingStar.x < 0 || shootingStar.y > canvas.height) {
                    shootingStar = null;
                }
            }

            animationFrameId = requestAnimationFrame(drawStars);
        };

        resizeCanvas();
        drawStars();

        window.addEventListener("resize", resizeCanvas);

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, [density, speed]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none z-[1]"
        />
    );
};
