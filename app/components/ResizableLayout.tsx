'use client';

import React, { useEffect, useRef } from 'react';
import {
    Panel,
    Group,
    Separator,
    useGroupRef,
} from 'react-resizable-panels';
import { Editor } from './Editor';
import { Preview } from './Preview';
import { useMarkdownStore } from '../store';

export function ResizableLayout() {
    const viewMode = useMarkdownStore((s) => s.viewMode);
    const groupEl = useRef<HTMLDivElement | null>(null);
    const groupRef = useGroupRef();
    const sepEl = useRef<HTMLDivElement | null>(null);

    // react-resizable-panels hardcodes aria-orientation on role="group",
    // which ARIA forbids (M-7.1). Strip it post-mount; orientation is still
    // conveyed visually and via the labelled separator.
    useEffect(() => {
        groupEl.current?.removeAttribute('aria-orientation');
    }, [viewMode]);

    // Keyboard resize (3.3): the Separator takes no tabIndex/role props, so
    // wire focusability + arrow handling onto its DOM node imperatively.
    useEffect(() => {
        const node = sepEl.current;
        const api = groupRef.current;
        if (!node || !api) return;
        node.tabIndex = 0;
        node.setAttribute('role', 'separator');
        node.setAttribute('aria-label', 'Resize editor and preview. Arrow keys move the split.');
        node.setAttribute('aria-valuemin', '20');
        node.setAttribute('aria-valuemax', '80');
        const onKeys = (e: KeyboardEvent) => {
            if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
            e.preventDefault();
            const layout = api.getLayout();
            const ids = Object.keys(layout);
            if (ids.length < 2) return;
            const delta = e.key === 'ArrowLeft' ? -5 : 5;
            const first = Math.min(80, Math.max(20, (layout[ids[0]] ?? 50) + delta));
            api.setLayout({ [ids[0]]: first, [ids[1]]: 100 - first });
        };
        node.addEventListener('keydown', onKeys);
        return () => node.removeEventListener('keydown', onKeys);
    }, [viewMode, groupRef]);

    if (viewMode === 'editor') {
        return (
            <div className="flex-1 h-full overflow-hidden">
                <Editor />
            </div>
        );
    }

    if (viewMode === 'preview') {
        return (
            <div className="flex-1 h-full overflow-hidden">
                <Preview />
            </div>
        );
    }

    return (
        <div className="flex-1 h-full overflow-hidden">
            <Group orientation="horizontal" elementRef={groupEl} groupRef={groupRef} aria-label="Editor and preview panes">
                <Panel id="editor" defaultSize={50} minSize={20}>
                    <Editor />
                </Panel>

                <Separator
                    elementRef={sepEl}
                    className="w-2 min-w-[8px] bg-[var(--sidebar-border)] hover:bg-[var(--accent)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] relative before:content-[''] before:absolute before:inset-y-0 before:-left-2 before:-right-2"
                />

                <Panel id="preview" defaultSize={50} minSize={20}>
                    <Preview />
                </Panel>
            </Group>
        </div>
    );
}
