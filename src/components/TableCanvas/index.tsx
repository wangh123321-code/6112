import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import type { Position } from '../../engine/types';
import { COLORS, TABLE_DIMENSIONS } from '../../engine/constants';

interface TableCanvasProps {
  playerPosition: Position;
  aiPosition: Position;
  resolving: boolean;
  lastWinner: 'player' | 'ai' | null;
}

interface PixiGraphicsWithTarget extends PIXI.Graphics {
  targetX?: number;
  targetY?: number;
}

interface PixiAppWithExtras extends PIXI.Application {
  _updateMarkers?: (
    marker: PIXI.Graphics,
    pos: Position,
    isPlayer: boolean
  ) => void;
  _centerX?: number;
  _centerY?: number;
  _tableY?: number;
  _tableH?: number;
}

export default function TableCanvas({
  playerPosition,
  aiPosition,
  resolving,
  lastWinner,
}: TableCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PixiAppWithExtras | null>(null);
  const playerMarkerRef = useRef<PixiGraphicsWithTarget | null>(null);
  const aiMarkerRef = useRef<PixiGraphicsWithTarget | null>(null);
  const ballLayerRef = useRef<PIXI.Container | null>(null);
  const animatingRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = TABLE_DIMENSIONS.width;
    const height = TABLE_DIMENSIONS.height;

    const app = new PIXI.Application({
      width,
      height,
      backgroundColor: 0x1a1a2e,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
    }) as PixiAppWithExtras;
    container.appendChild(app.view as unknown as Node);
    appRef.current = app;

    const tableContainer = new PIXI.Container();
    app.stage.addChild(tableContainer);

    const padding = 20;
    const tableX = padding;
    const tableY = padding;
    const tableW = width - padding * 2;
    const tableH = height - padding * 2;
    const halfW = tableW / 2;
    const centerX = tableX + halfW;
    const centerY = tableY + tableH / 2;

    const tableBg = new PIXI.Graphics();
    tableBg.beginFill(COLORS.tableBg);
    tableBg.drawRoundedRect(tableX, tableY, tableW, tableH, 8);
    tableBg.endFill();
    tableContainer.addChild(tableBg);

    const gridTexture = (() => {
      const g = new PIXI.Graphics();
      g.lineStyle(1, 0xffffff, 0.06);
      for (let i = 0; i <= 10; i++) {
        const x = tableX + (tableW / 10) * i;
        g.moveTo(x, tableY);
        g.lineTo(x, tableY + tableH);
      }
      for (let j = 0; j <= 14; j++) {
        const y = tableY + (tableH / 14) * j;
        g.moveTo(tableX, y);
        g.lineTo(tableX + tableW, y);
      }
      return app.renderer.generateTexture(g);
    })();
    const gridSprite = new PIXI.Sprite(gridTexture);
    tableContainer.addChild(gridSprite);

    const lines = new PIXI.Graphics();
    lines.lineStyle(TABLE_DIMENSIONS.lineWidth, COLORS.tableLine, 1);
    lines.drawRoundedRect(tableX, tableY, tableW, tableH, 8);
    lines.moveTo(tableX, centerY);
    lines.lineTo(tableX + tableW, centerY);
    tableContainer.addChild(lines);

    const net = new PIXI.Graphics();
    net.lineStyle(2, COLORS.tableLine, 0.5);
    for (let i = 0; i < 40; i++) {
      const x = tableX + (tableW / 40) * i;
      net.moveTo(x, centerY - 6);
      net.lineTo(x, centerY + 6);
    }
    tableContainer.addChild(net);

    const centerMark = new PIXI.Graphics();
    centerMark.lineStyle(2, COLORS.highlight, 0.5);
    centerMark.drawCircle(centerX, centerY, 8);
    tableContainer.addChild(centerMark);

    const ballLayer = new PIXI.Container();
    tableContainer.addChild(ballLayer);
    ballLayerRef.current = ballLayer;

    function createMarker(color: number, label: string, yPos: number): PIXI.Graphics {
      const g = new PIXI.Graphics();
      g.beginFill(color, 0.9);
      g.lineStyle(3, 0xffffff, 0.8);
      g.drawCircle(0, 0, 18);
      g.endFill();
      g.beginFill(0xffffff, 0.15);
      g.drawCircle(-5, -5, 6);
      g.endFill();

      const text = new PIXI.Text(label, {
        fontFamily: 'Noto Sans SC',
        fontSize: 13,
        fill: 0xffffff,
        fontWeight: 'bold',
      });
      text.anchor.set(0.5);
      text.position.set(0, 30);
      g.addChild(text);

      g.position.set(centerX, yPos);
      return g;
    }

    const playerMarker = createMarker(COLORS.player, '你', tableY + tableH * 0.78) as PixiGraphicsWithTarget;
    const aiMarker = createMarker(COLORS.ai, 'AI对手', tableY + tableH * 0.22) as PixiGraphicsWithTarget;
    tableContainer.addChild(playerMarker);
    tableContainer.addChild(aiMarker);
    playerMarkerRef.current = playerMarker;
    aiMarkerRef.current = aiMarker;

    const updateMarkerPosition = (
      marker: PixiGraphicsWithTarget,
      pos: Position,
      isPlayer: boolean
    ) => {
      const targetX = centerX + pos.x * (halfW * 0.7);
      const baseY = isPlayer
        ? tableY + tableH * 0.78
        : tableY + tableH * 0.22;
      const yOffset = isPlayer ? pos.y * 40 : -pos.y * 40;
      const targetY = baseY + yOffset;

      marker.targetX = targetX;
      marker.targetY = targetY;
    };

    updateMarkerPosition(playerMarker, playerPosition, true);
    updateMarkerPosition(aiMarker, aiPosition, false);

    playerMarker.x = playerMarker.targetX ?? playerMarker.x;
    playerMarker.y = playerMarker.targetY ?? playerMarker.y;
    aiMarker.x = aiMarker.targetX ?? aiMarker.x;
    aiMarker.y = aiMarker.targetY ?? aiMarker.y;

    app.ticker.add(() => {
      [playerMarker, aiMarker].forEach((marker) => {
        const tx = marker.targetX;
        const ty = marker.targetY;
        if (tx !== undefined && ty !== undefined) {
          marker.x += (tx - marker.x) * 0.12;
          marker.y += (ty - marker.y) * 0.12;
        }
      });
    });

    app._updateMarkers = updateMarkerPosition;
    app._centerX = centerX;
    app._centerY = centerY;
    app._tableY = tableY;
    app._tableH = tableH;

    return () => {
      app.destroy(true, { children: true, texture: true, baseTexture: true });
      appRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const app = appRef.current;
    if (!app) return;
    const updatePos = app._updateMarkers;
    const playerMarker = playerMarkerRef.current;
    const aiMarker = aiMarkerRef.current;
    if (updatePos && playerMarker && aiMarker) {
      updatePos(playerMarker, playerPosition, true);
      updatePos(aiMarker, aiPosition, false);
    }
  }, [playerPosition, aiPosition]);

  useEffect(() => {
    const app = appRef.current;
    if (!app || !resolving) return;

    const ballLayer = ballLayerRef.current;
    const playerMarker = playerMarkerRef.current;
    const aiMarker = aiMarkerRef.current;
    if (!ballLayer || !playerMarker || !aiMarker) return;

    if (animatingRef.current) return;
    animatingRef.current = true;

    const startX = playerMarker.x;
    const startY = playerMarker.y;
    const endX = aiMarker.x;
    const endY = aiMarker.y;

    const balls: PIXI.Graphics[] = [];
    const ballCount = 8;

    for (let i = 0; i < ballCount; i++) {
      const ball = new PIXI.Graphics();
      ball.beginFill(COLORS.ball, 0.9 - i * 0.08);
      ball.drawCircle(0, 0, 5 - i * 0.3);
      ball.endFill();
      ball.alpha = 0;
      ballLayer.addChild(ball);
      balls.push(ball);
    }

    let t = 0;
    const duration = 60;
    const onTick = () => {
      t += 1;
      const progress = t / duration;
      balls.forEach((ball, i) => {
        const bp = Math.max(0, Math.min(1, progress - i * 0.03));
        if (bp <= 0) {
          ball.alpha = 0;
          return;
        }
        const arcHeight = 50 * Math.sin(bp * Math.PI);
        ball.x = startX + (endX - startX) * bp;
        ball.y = startY + (endY - startY) * bp - arcHeight;
        ball.alpha = Math.sin(bp * Math.PI) * 0.9;
      });

      if (t >= duration + 10) {
        app.ticker.remove(onTick);
        balls.forEach((b) => ballLayer.removeChild(b));
        animatingRef.current = false;
      }
    };
    app.ticker.add(onTick);
  }, [resolving]);

  useEffect(() => {
    const app = appRef.current;
    if (!app || !lastWinner) return;
    const marker = lastWinner === 'player' ? playerMarkerRef.current : aiMarkerRef.current;
    if (!marker) return;

    const originalScale = marker.scale.x;
    let t = 0;
    const duration = 30;
    const onTick = () => {
      t += 1;
      const p = t / duration;
      const pulse = 1 + Math.sin(p * Math.PI * 2) * 0.2;
      marker.scale.set(originalScale * pulse);
      if (t >= duration) {
        marker.scale.set(originalScale);
        app.ticker.remove(onTick);
      }
    };
    app.ticker.add(onTick);
  }, [lastWinner]);

  return (
    <div
      ref={containerRef}
      className="flex items-center justify-center rounded-xl overflow-hidden shadow-2xl"
      style={{ width: TABLE_DIMENSIONS.width, height: TABLE_DIMENSIONS.height }}
    />
  );
}
