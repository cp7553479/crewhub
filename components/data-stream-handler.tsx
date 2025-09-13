'use client';

// DataStreamHandler 组件
// 职责：监听来自 UI 数据流的数据增量（dataStream），并基于增量驱动 Artifact 的状态与元数据更新。
// 使用方式：必须包裹在 DataStreamProvider 与 useArtifact Provider 环境内。

import { useEffect, useRef } from 'react';
import { artifactDefinitions } from './artifact';
import { initialArtifactData, useArtifact } from '@/hooks/use-artifact';
import { useDataStream } from './data-stream-provider';

export function DataStreamHandler() {
  // 从数据流上下文中获取最新的数据增量数组（有序）
  const { dataStream } = useDataStream();

  // 从 Artifact 上下文中获取与更新 Artifact 的方法
  const { artifact, setArtifact, setMetadata } = useArtifact();
  // 记录上一次处理到的数据增量索引，避免重复处理
  const lastProcessedIndex = useRef(-1);

  useEffect(() => {
    // 若当前没有数据增量，直接返回
    if (!dataStream?.length) return;

    // 仅处理自上次索引之后的新增量
    const newDeltas = dataStream.slice(lastProcessedIndex.current + 1);
    lastProcessedIndex.current = dataStream.length - 1;

    newDeltas.forEach((delta) => {
      // 根据当前 artifact 的 kind 找到对应的处理定义
      const artifactDefinition = artifactDefinitions.find(
        (artifactDefinition) => artifactDefinition.kind === artifact.kind,
      );

      // 若定义了 onStreamPart 钩子，优先让各 Artifact 类型自行处理增量（可更新内容与元数据）
      if (artifactDefinition?.onStreamPart) {
        artifactDefinition.onStreamPart({
          streamPart: delta,
          setArtifact,
          setMetadata,
        });
      }

      // 针对通用的数据指令，统一维护 Artifact 的通用字段与状态机
      setArtifact((draftArtifact) => {
        // 若当前还没有 Artifact，创建一个初始对象并标记为 streaming
        if (!draftArtifact) {
          return { ...initialArtifactData, status: 'streaming' };
        }

        switch (delta.type) {
          // 关联数据的持久化 ID（例如文档 ID）
          case 'data-id':
            return {
              ...draftArtifact,
              documentId: delta.data,
              status: 'streaming',
            };

          // 实时更新标题
          case 'data-title':
            return {
              ...draftArtifact,
              title: delta.data,
              status: 'streaming',
            };

          // 切换/确定 Artifact 的类型（code/text/image...）
          case 'data-kind':
            return {
              ...draftArtifact,
              kind: delta.data,
              status: 'streaming',
            };

          // 清空内容（通常出现在新的流式片段开始前）
          case 'data-clear':
            return {
              ...draftArtifact,
              content: '',
              status: 'streaming',
            };

          // 流式结束，进入空闲状态
          case 'data-finish':
            return {
              ...draftArtifact,
              status: 'idle',
            };

          default:
            return draftArtifact;
        }
      });
    });
  }, [dataStream, setArtifact, setMetadata, artifact]);

  return null;
}
