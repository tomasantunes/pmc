import { hierarchy } from 'd3-hierarchy';

const SVG_NS = 'http://www.w3.org/2000/svg';
const BACKGROUND = '#f7fafc';
const MAX_CANVAS_SIZE = 12000;
const MIN_WIDTH = 1400;
const MIN_HEIGHT = 900;
const PAGE_PADDING = 90;
const ROOT_TOP = 70;
const FOLDER_TOP = 250;
const TASK_TOP = 380;
const COLUMN_WIDTH = 300;
const COLUMN_GAP = 70;
const TASK_GAP = 28;
const NODE_WIDTH = 250;
const ROOT_WIDTH = 300;
const LINE_HEIGHT = 17;
const PADDING_Y = 12;
const MAX_LABEL_CHARS = 28;
const MAX_LABEL_LINES = 4;

function createSvgElement(name) {
  return document.createElementNS(SVG_NS, name);
}

function wrapLabel(label) {
  const words = String(label || '')
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((word) => {
      if (word.length <= MAX_LABEL_CHARS) return [word];

      const chunks = [];
      for (let i = 0; i < word.length; i += MAX_LABEL_CHARS) {
        chunks.push(word.slice(i, i + MAX_LABEL_CHARS));
      }
      return chunks;
    });

  const lines = [];
  let currentLine = '';

  words.forEach((word) => {
    if (lines.length >= MAX_LABEL_LINES) return;

    const candidate = currentLine ? `${currentLine} ${word}` : word;

    if (candidate.length <= MAX_LABEL_CHARS) {
      currentLine = candidate;
      return;
    }

    if (currentLine) lines.push(currentLine);
    currentLine = word;
  });

  if (currentLine && lines.length < MAX_LABEL_LINES) {
    lines.push(currentLine);
  }

  if (words.join(' ').length > lines.join(' ').length && lines.length > 0) {
    lines[lines.length - 1] = `${lines[lines.length - 1].slice(0, MAX_LABEL_CHARS - 3)}...`;
  }

  return lines.length > 0 ? lines : [''];
}

function labelHeight(label) {
  return Math.max(48, wrapLabel(label).length * LINE_HEIGHT + PADDING_Y * 2);
}

function nodeFill(depth) {
  if (depth === 0) return '#154775';
  if (depth === 1) return '#2563a1';
  return '#ffffff';
}

function nodeStroke(depth) {
  if (depth <= 1) return '#154775';
  return '#bfd1dd';
}

function textFill(depth) {
  return depth <= 1 ? '#ffffff' : '#17212b';
}

function appendNode(svg, node, point, width = NODE_WIDTH) {
  const group = createSvgElement('g');
  const lines = wrapLabel(node.data.name);
  const height = Math.max(48, lines.length * LINE_HEIGHT + PADDING_Y * 2);

  group.setAttribute('transform', `translate(${point.x}, ${point.y})`);
  svg.appendChild(group);

  const rect = createSvgElement('rect');
  rect.setAttribute('x', String(-width / 2));
  rect.setAttribute('y', String(-height / 2));
  rect.setAttribute('width', String(width));
  rect.setAttribute('height', String(height));
  rect.setAttribute('rx', '10');
  rect.setAttribute('fill', nodeFill(node.depth));
  rect.setAttribute('stroke', nodeStroke(node.depth));
  rect.setAttribute('stroke-width', node.depth <= 1 ? '0' : '2');
  group.appendChild(rect);

  const text = createSvgElement('text');
  const startY = -(lines.length - 1) * LINE_HEIGHT / 2;

  text.setAttribute('fill', textFill(node.depth));
  text.setAttribute('font-family', 'Arial, sans-serif');
  text.setAttribute('font-size', node.depth === 0 ? '20' : '13');
  text.setAttribute('font-weight', node.depth <= 1 ? '700' : '500');
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('dominant-baseline', 'middle');
  text.setAttribute('pointer-events', 'none');

  lines.forEach((line, index) => {
    const tspan = createSvgElement('tspan');
    tspan.setAttribute('x', '0');
    tspan.setAttribute('y', String(startY + index * LINE_HEIGHT));
    tspan.textContent = line;
    text.appendChild(tspan);
  });

  group.appendChild(text);
  return height;
}

function appendLink(svg, source, target) {
  const path = createSvgElement('path');
  const midY = source.y + (target.y - source.y) / 2;

  path.setAttribute(
    'd',
    `M${source.x},${source.y} C${source.x},${midY} ${target.x},${midY} ${target.x},${target.y}`,
  );
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', '#7aa6c6');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-width', '2');
  svg.appendChild(path);
}

function flattenFolderNodes(root) {
  return (root.children || []).flatMap((category) => (
    (category.children || []).map((folder) => ({
      folder,
      label: `${category.data.name}: ${folder.data.name}`,
    }))
  ));
}

function calculateColumnHeight(folder) {
  const folderHeight = labelHeight(folder.data.name);
  const taskHeights = (folder.children || []).map((task) => labelHeight(task.data.name));
  const tasksHeight = taskHeights.reduce((sum, height) => sum + height, 0);
  const gapsHeight = Math.max(0, taskHeights.length - 1) * TASK_GAP;

  return (FOLDER_TOP + folderHeight / 2) + 120 + tasksHeight + gapsHeight + PAGE_PADDING;
}

function buildMindmapSvg(data) {
  const normalizedData = data?.name ? data : { name: 'PMC Overview', children: [] };
  const root = hierarchy(normalizedData);
  const folders = flattenFolderNodes(root);
  const columnCount = Math.max(1, folders.length);
  const contentWidth = columnCount * COLUMN_WIDTH + Math.max(0, columnCount - 1) * COLUMN_GAP;
  const width = Math.min(MAX_CANVAS_SIZE, Math.max(MIN_WIDTH, contentWidth + PAGE_PADDING * 2));

  const calculatedHeight = folders.length > 0
    ? Math.max(...folders.map(({ folder }) => calculateColumnHeight(folder)))
    : MIN_HEIGHT;

  const height = Math.min(MAX_CANVAS_SIZE, Math.max(MIN_HEIGHT, calculatedHeight));
  const rootPoint = { x: width / 2, y: ROOT_TOP + labelHeight(root.data.name) / 2 };
  const firstColumnX = width / 2 - contentWidth / 2 + COLUMN_WIDTH / 2;

  const svg = createSvgElement('svg');
  svg.setAttribute('xmlns', SVG_NS);
  svg.setAttribute('width', String(width));
  svg.setAttribute('height', String(height));
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

  const background = createSvgElement('rect');
  background.setAttribute('width', String(width));
  background.setAttribute('height', String(height));
  background.setAttribute('fill', BACKGROUND);
  svg.appendChild(background);

  const linksLayer = createSvgElement('g');
  const nodesLayer = createSvgElement('g');

  svg.appendChild(linksLayer);
  svg.appendChild(nodesLayer);

  folders.forEach(({ folder, label }, index) => {
    const folderPoint = {
      x: firstColumnX + index * (COLUMN_WIDTH + COLUMN_GAP),
      y: FOLDER_TOP,
    };

    const folderData = { ...folder.data, name: label };
    const folderNode = { ...folder, data: folderData, depth: 1 };

    appendLink(linksLayer, rootPoint, folderPoint);

    const folderHeight = appendNode(nodesLayer, folderNode, folderPoint, NODE_WIDTH);
    let taskY = TASK_TOP + Math.max(0, folderHeight - 48) / 2;

    (folder.children || []).forEach((task) => {
      const taskHeight = labelHeight(task.data.name);

      const taskPoint = {
        x: folderPoint.x,
        y: taskY + taskHeight / 2,
      };

      appendLink(
        linksLayer,
        { x: folderPoint.x, y: folderPoint.y + folderHeight / 2 },
        { x: taskPoint.x, y: taskPoint.y - taskHeight / 2 },
      );

      appendNode(nodesLayer, task, taskPoint, NODE_WIDTH);
      taskY += taskHeight + TASK_GAP;
    });
  });

  appendNode(nodesLayer, root, rootPoint, ROOT_WIDTH);

  return svg;
}

function downloadDataUrl(dataUrl, filename) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function svgToPngDataUrl(svg) {
  return new Promise((resolve, reject) => {
    const width = Number(svg.getAttribute('width'));
    const height = Number(svg.getAttribute('height'));
    const serializedSvg = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([serializedSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext('2d');
      context.fillStyle = BACKGROUND;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      URL.revokeObjectURL(url);

      const dataUrl = canvas.toDataURL('image/png');

      if (dataUrl === 'data:,') {
        reject(new Error('Could not export mindmap because it is too large for this browser.'));
        return;
      }

      resolve(dataUrl);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not render mindmap image.'));
    };

    image.src = url;
  });
}

export async function exportMindmapPng(data, filename = 'pmc-mindmap.png') {
  const svg = buildMindmapSvg(data);
  const dataUrl = await svgToPngDataUrl(svg);
  downloadDataUrl(dataUrl, filename);
}