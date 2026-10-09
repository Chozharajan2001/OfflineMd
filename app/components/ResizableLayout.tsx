'use client';

import React from 'react';
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
            <Group orientation="horizontal">
                <Panel defaultSize={50} minSize={20}>
                    <Editor />
                </Panel>

                <Separator className="w-2 min-w-[8px] bg-[var(--sidebar-border)] hover:bg-[var(--accent)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]" />

                <Panel defaultSize={50} minSize={20}>
                    <Preview />
                </Panel>
            </Group>
        </div>
    );
}
