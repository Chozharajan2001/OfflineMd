'use client';

import React, { useEffect, useRef } from 'react';
import {
    Panel,
    Group,
    Separator,
} from 'react-resizable-panels';
import { Editor } from './Editor';
import { Preview } from './Preview';
import { useMarkdownStore } from '../store';

export function ResizableLayout() {
    const viewMode = useMarkdownStore((s) => s.viewMode);
    const groupEl = useRef<HTMLDivElement | null>(null);

    // react-resizable-panels hardcodes aria-orientation on role="group",
    // which ARIA forbids (M-7.1). Strip it post-mount; orientation is still
    // conveyed visually and via the labelled separator.
    useEffect(() => {
        groupEl.current?.removeAttribute('aria-orientation');
    }, [viewMode]);

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
            <Group orientation="horizontal" elementRef={groupEl} aria-label="Editor and preview panes">
                <Panel defaultSize={50} minSize={20}>
                    <Editor />
                </Panel>

                <Separator className="w-2 min-w-[8px] bg-[var(--sidebar-border)] hover:bg-[var(--accent)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] relative before:content-[''] before:absolute before:inset-y-0 before:-left-2 before:-right-2" />

                <Panel defaultSize={50} minSize={20}>
                    <Preview />
                </Panel>
            </Group>
        </div>
    );
}
