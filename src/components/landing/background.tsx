import { useEffect, useRef } from "react";
import { useThemeStore } from "../../store/themeStore";

const HEX_SYMBOLS = ["TMST", "WMSTCS", "OUSD", "WMST", "MSTC", "OUSD", "WMSTC", "WMST", "MSTC", "TMST"];

interface Node {
    bx: number; by: number; x: number; y: number;
    phase: number; speed: number; size: number;
    active: boolean; label: string | null;
    pulseSpeed: number; pulsePhase: number;
    floatAmp: number; floatPhaseX: number; floatPhaseY: number;
    connections: number[]; alpha: number;
}

interface Packet {
    from: number; to: number;
    progress: number; speed: number;
    color: "cyan" | "indigo";
}

export default function DexBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { theme } = useThemeStore();
    const isDark = theme === "dark";

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d")!;
        let W = 0, H = 0, rafId: number, t = 0;
        const mouse = { x: -999, y: -999 };
        let nodes: Node[] = [];
        let packets: Packet[] = [];

        function resize() {
            if (!canvas) return;
            W = canvas.width = window.innerWidth;
            H = canvas.height = window.innerHeight;
            buildNodes();
            spawnPackets();
        }

        function buildNodes() {
            nodes = [];
            const cols = Math.ceil(W / 110) + 1;
            const rows = Math.ceil(H / 95) + 1;
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const ox = r % 2 === 0 ? 0 : 55;
                    nodes.push({
                        bx: c * 110 + ox - 55,
                        by: r * 95 - 47,
                        x: 0, y: 0,
                        phase: Math.random() * Math.PI * 2,
                        speed: 0.008 + Math.random() * 0.006,
                        size: 4 + Math.random() * 6,
                        active: Math.random() < 0.16,
                        label: Math.random() < 0.11
                            ? HEX_SYMBOLS[Math.floor(Math.random() * HEX_SYMBOLS.length)]
                            : null,
                        pulseSpeed: 0.02 + Math.random() * 0.015,
                        pulsePhase: Math.random() * Math.PI * 2,
                        floatAmp: 3 + Math.random() * 5,
                        floatPhaseX: Math.random() * Math.PI * 2,
                        floatPhaseY: Math.random() * Math.PI * 2,
                        connections: [],
                        alpha: 0.15 + Math.random() * 0.35,
                    });
                }
            }
            // connect nearby active nodes
            for (let i = 0; i < nodes.length; i++) {
                if (!nodes[i].active) continue;
                for (let j = i + 1; j < nodes.length; j++) {
                    if (!nodes[j].active) continue;
                    const dx = nodes[i].bx - nodes[j].bx;
                    const dy = nodes[i].by - nodes[j].by;
                    if (Math.sqrt(dx * dx + dy * dy) < 180 && Math.random() < 0.55) {
                        nodes[i].connections.push(j);
                    }
                }
            }
        }

        function spawnPackets() {
            packets = [];
            for (let i = 0; i < nodes.length; i++) {
                if (!nodes[i].active) continue;
                for (const j of nodes[i].connections) {
                    if (Math.random() < 0.4) {
                        packets.push({
                            from: i, to: j,
                            progress: Math.random(),
                            speed: 0.003 + Math.random() * 0.004,
                            color: Math.random() < 0.5 ? "cyan" : "indigo",
                        });
                    }
                }
            }
        }

        function hexPath(cx: number, cy: number, r: number) {
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const a = (Math.PI / 180) * (60 * i - 30);
                i === 0
                    ? ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a))
                    : ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
            }
            ctx.closePath();
        }

        function drawDots() {
            const gap = 28;
            ctx.fillStyle = isDark ? "rgba(255,255,255,.03)" : "rgba(0,0,0,.04)";
            for (let x = 0; x < W; x += gap)
                for (let y = 0; y < H; y += gap) {
                    ctx.beginPath();
                    ctx.arc(x, y, 1, 0, Math.PI * 2);
                    ctx.fill();
                }
        }

        function drawOrbs() {
            const orbs = [
                { xp: 0.12, yp: -0.05, r: 500, c: "99,102,241" },
                { xp: 0.88, yp: 1.08, r: 560, c: "6,182,212" },
                { xp: 0.5, yp: 0.5, r: 320, c: "139,92,246" },
            ];
            const a = isDark ? 0.07 : 0.045;
            for (const o of orbs) {
                const ox = o.xp * W, oy = o.yp * H;
                const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, o.r);
                g.addColorStop(0, `rgba(${o.c},${a})`);
                g.addColorStop(1, "rgba(0,0,0,0)");
                ctx.fillStyle = g;
                ctx.fillRect(0, 0, W, H);
            }
        }

        function drawScanBeam() {
            const scanX = (Math.sin(t * 0.003) * 0.6 + 0.5) * W;
            const g = ctx.createLinearGradient(scanX - 100, 0, scanX + 100, 0);
            const a = isDark ? 0.1 : 0.06;
            g.addColorStop(0, "rgba(99,102,241,0)");
            g.addColorStop(0.5, `rgba(6,182,212,${a})`);
            g.addColorStop(1, "rgba(99,102,241,0)");
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, W, H);
        }

        function drawEdges() {
            const palettes = [
                "rgba(6,182,212,",
                "rgba(99,102,241,",
                "rgba(139,92,246,",
            ];
            const a = isDark ? 0.12 : 0.07;
            for (let i = 0; i < nodes.length; i++) {
                if (!nodes[i].active) continue;
                const col = palettes[i % palettes.length];
                for (const j of nodes[i].connections) {
                    ctx.beginPath();
                    ctx.moveTo(nodes[i].x, nodes[i].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);
                    ctx.strokeStyle = col + a + ")";
                    ctx.lineWidth = 0.6;
                    ctx.stroke();
                }
            }
        }

        function drawPackets() {
            for (const p of packets) {
                const a = nodes[p.from], b = nodes[p.to];
                if (!a || !b) continue;
                p.progress += p.speed;
                if (p.progress > 1) p.progress = 0;
                const px = a.x + (b.x - a.x) * p.progress;
                const py = a.y + (b.y - a.y) * p.progress;
                const c = p.color === "cyan" ? "rgba(6,182,212," : "rgba(99,102,241,";
                // trail
                for (let k = 0; k < 10; k++) {
                    const tp = p.progress - k * 0.012;
                    if (tp < 0) continue;
                    const tx = a.x + (b.x - a.x) * tp;
                    const ty = a.y + (b.y - a.y) * tp;
                    ctx.beginPath();
                    ctx.arc(tx, ty, 1.5 * (1 - k / 10 * 0.6), 0, Math.PI * 2);
                    ctx.fillStyle = c + ((1 - k / 10) * (isDark ? 0.7 : 0.5)) + ")";
                    ctx.fill();
                }
                // glow head
                const hg = ctx.createRadialGradient(px, py, 0, px, py, 8);
                hg.addColorStop(0, c + (isDark ? 0.9 : 0.7) + ")");
                hg.addColorStop(1, c + "0)");
                ctx.beginPath();
                ctx.arc(px, py, 3, 0, Math.PI * 2);
                ctx.fillStyle = hg;
                ctx.fill();
            }
        }

        function drawPassiveNodes() {
            for (const n of nodes) {
                if (n.active) continue;
                const mdx = mouse.x - n.x, mdy = mouse.y - n.y;
                const boost = Math.max(0, 1 - Math.sqrt(mdx * mdx + mdy * mdy) / 90) * 0.5;
                ctx.beginPath();
                ctx.arc(n.x, n.y, 1.2 + boost * 2, 0, Math.PI * 2);
                ctx.fillStyle = isDark
                    ? `rgba(255,255,255,${n.alpha * 0.4 + boost * 0.3})`
                    : `rgba(0,0,0,${n.alpha * 0.18 + boost * 0.18})`;
                ctx.fill();
            }
        }

        function drawActiveNodes() {
            const palettes = [
                { s: "rgba(6,182,212,", f: "rgba(6,182,212," },
                { s: "rgba(99,102,241,", f: "rgba(99,102,241," },
                { s: "rgba(139,92,246,", f: "rgba(139,92,246," },
            ];
            for (let i = 0; i < nodes.length; i++) {
                const n = nodes[i];
                if (!n.active) continue;
                const pal = palettes[i % palettes.length];
                const pulse = (Math.sin(t * n.pulseSpeed + n.pulsePhase) + 1) * 0.5;
                const mdx = mouse.x - n.x, mdy = mouse.y - n.y;
                const boost = Math.max(0, 1 - Math.sqrt(mdx * mdx + mdy * mdy) / 120) * 0.4;

                // outer pulse ring
                hexPath(n.x, n.y, n.size * 1.8 + pulse * n.size * 0.8);
                ctx.strokeStyle = pal.s + (0.06 + pulse * 0.08 + boost) + ")";
                ctx.lineWidth = 0.8;
                ctx.stroke();

                // mid hex
                hexPath(n.x, n.y, n.size * 1.1);
                ctx.strokeStyle = pal.s + (0.18 + boost * 0.3) + ")";
                ctx.lineWidth = 0.8;
                ctx.stroke();
                ctx.fillStyle = pal.f + (0.05 + boost * 0.1) + ")";
                ctx.fill();

                // core dot
                ctx.beginPath();
                ctx.arc(n.x, n.y, n.size * 0.35 + pulse * 0.3, 0, Math.PI * 2);
                ctx.fillStyle = pal.f + (0.55 + pulse * 0.3 + boost * 0.3) + ")";
                ctx.fill();

                // token label chip
                if (n.label) {
                    ctx.font = "600 8.5px ui-monospace,monospace";
                    const lw = ctx.measureText(n.label).width + 14;
                    const lh = 16, ly = n.y - n.size * 1.8 - 10;
                    ctx.fillStyle = isDark ? "rgba(10,10,20,.75)" : "rgba(255,255,255,.88)";
                    ctx.beginPath();
                    (ctx as any).roundRect(n.x - lw / 2, ly - lh / 2, lw, lh, 4);
                    ctx.fill();
                    ctx.strokeStyle = pal.s + ".2)";
                    ctx.lineWidth = 0.6;
                    ctx.stroke();
                    ctx.fillStyle = pal.s + ".9)";
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillText(n.label, n.x, ly);
                }
            }
        }

        function tick() {
            t++;
            ctx.clearRect(0, 0, W, H);
            drawDots();
            drawOrbs();
            drawScanBeam();
            // update positions
            for (const n of nodes) {
                n.x = n.bx + Math.sin(t * n.speed + n.floatPhaseX) * n.floatAmp;
                n.y = n.by + Math.cos(t * n.speed * 0.8 + n.floatPhaseY) * n.floatAmp;
            }
            drawEdges();
            drawPackets();
            drawPassiveNodes();
            drawActiveNodes();
            rafId = requestAnimationFrame(tick);
        }

        const onMouse = (e: MouseEvent) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        };
        const onLeave = () => { mouse.x = -999; mouse.y = -999; };

        resize();
        tick();
        window.addEventListener("resize", resize);
        window.addEventListener("mousemove", onMouse);
        window.addEventListener("mouseleave", onLeave);
        return () => {
            cancelAnimationFrame(rafId);
            window.removeEventListener("resize", resize);
            window.removeEventListener("mousemove", onMouse);
            window.removeEventListener("mouseleave", onLeave);
        };
    }, [isDark]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 w-full h-full pointer-events-none z-0"
            aria-hidden="true"
        />
    );
}