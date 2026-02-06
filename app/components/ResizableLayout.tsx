'use client';

import React from 'react';
import {
    Panel,
    Group,
    Separator,
} from 'react-resizable-panels';
import { Editor } from './Editor';
import { Preview } from './Preview';

export function ResizableLayout() {
    return (
        <div className="flex-1 h-full overflow-hidden">
            <Group orientation="horizontal">
                <Panel defaultSize={50} minSize={20}>
                    <Editor />
                </Panel>

                <Separator className="w-2 bg-gray-800 hover:bg-blue-600 transition-colors" />

                <Panel defaultSize={50} minSize={20}>
                    <Preview />
                </Panel>
            </Group>
        </div>
    );
}
