import { Block, BlockType } from '@/lib/blocks.repository';
import { TextBlock } from './TextBlock';
import { ChecklistBlock } from './ChecklistBlock';
import { ListBlock } from './ListBlock';
import { TitleBlock } from './TitleBlock';
import { SubtitleBlock } from './SubtitleBlock';
import { QuoteBlock } from './QuoteBlock';

interface BlockRendererProps {
  block: Block;
  onUpdate: () => void;
  autoFocus?: boolean;
  onTransform: (blockId: number, newType: BlockType, newContent: string | null) => void;
  onFocusBlock?: () => void;
  onInsertBlockBelow: (blockId: number, type?: BlockType) => void;
  onDeleteBlock?: (block: Block) => void;
}

export function BlockRenderer({
  block,
  onUpdate,
  autoFocus,
  onTransform,
  onFocusBlock,
  onInsertBlockBelow,
  onDeleteBlock,
}: BlockRendererProps) {
  switch (block.type) {
    case 'text':
      return (
        <TextBlock
          block={block}
          onUpdate={onUpdate}
          autoFocus={autoFocus}
          onTransform={onTransform}
          onFocusBlock={onFocusBlock}
          onInsertBlockBelow={() => onInsertBlockBelow(block.id)}
          onDelete={() => onDeleteBlock?.(block)}
        />
      );
    case 'title':
      return (
        <TitleBlock
          block={block}
          onUpdate={onUpdate}
          autoFocus={autoFocus}
          onTransform={onTransform}
          onFocusBlock={onFocusBlock}
          onInsertBlockBelow={() => onInsertBlockBelow(block.id)}
          onDelete={() => onDeleteBlock?.(block)}
        />
      );
    case 'subtitle':
      return (
        <SubtitleBlock
          block={block}
          onUpdate={onUpdate}
          autoFocus={autoFocus}
          onTransform={onTransform}
          onFocusBlock={onFocusBlock}
          onInsertBlockBelow={() => onInsertBlockBelow(block.id)}
          onDelete={() => onDeleteBlock?.(block)}
        />
      );
    case 'quote':
      return (
        <QuoteBlock
          block={block}
          onUpdate={onUpdate}
          autoFocus={autoFocus}
          onTransform={onTransform}
          onFocusBlock={onFocusBlock}
          onInsertBlockBelow={() => onInsertBlockBelow(block.id)}
          onDelete={() => onDeleteBlock?.(block)}
        />
      );
    case 'checklist':
      return (
        <ChecklistBlock
          block={block}
          onUpdate={onUpdate}
          autoFocus={autoFocus}
          onFocusBlock={onFocusBlock}
          onTransform={onTransform}
          onInsertBlockBelow={() => onInsertBlockBelow(block.id)}
          onDelete={() => onDeleteBlock?.(block)}
        />
      );
    case 'list':
      return (
        <ListBlock
          block={block}
          onUpdate={onUpdate}
          autoFocus={autoFocus}
          onFocusBlock={onFocusBlock}
          onTransform={onTransform}
          onInsertBlockBelow={() => onInsertBlockBelow(block.id)}
          onDelete={() => onDeleteBlock?.(block)}
        />
      );
    default:
      return null;
  }
}
