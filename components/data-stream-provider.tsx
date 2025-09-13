'use client';

// DataStreamProvider：提供 UI 数据流上下文，用于在应用中收集与共享流式增量数据。
// useDataStream：消费上下文，读写 dataStream（例如在流式响应中持续 push 增量）。

import React, { createContext, useContext, useMemo, useState } from 'react';
import type { DataUIPart } from 'ai';
import type { CustomUIDataTypes } from '@/lib/types';

interface DataStreamContextValue {
  // 存放 UI 数据流增量的列表（按到达顺序累积）
  dataStream: DataUIPart<CustomUIDataTypes>[];
  // 写入器：用于设置/追加增量
  setDataStream: React.Dispatch<
    React.SetStateAction<DataUIPart<CustomUIDataTypes>[]>
  >;
}

const DataStreamContext = createContext<DataStreamContextValue | null>(null);

export function DataStreamProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // 在本地状态中维护增量数据
  const [dataStream, setDataStream] = useState<DataUIPart<CustomUIDataTypes>[]>(
    [],
  );

  // 缓存上下文 value，避免非必要的子组件重渲染
  const value = useMemo(() => ({ dataStream, setDataStream }), [dataStream]);

  return (
    <DataStreamContext.Provider value={value}>
      {children}
    </DataStreamContext.Provider>
  );
}

export function useDataStream() {
  const context = useContext(DataStreamContext);
  if (!context) {
    // 防御性提示：必须在 Provider 内部使用
    throw new Error('useDataStream must be used within a DataStreamProvider');
  }
  return context;
}
