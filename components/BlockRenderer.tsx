import { Block, BlockType, ImageBlockContent } from '@/lib/blocks.repository';
import { MarkdownShortcutHintType } from '@/lib/ux/hints';
import { TextBlock } from './TextBlock';
import { ChecklistBlock } from './ChecklistBlock';
import { ListBlock } from './ListBlock';
import { TitleBlock } from './TitleBlock';
import { SubtitleBlock } from './SubtitleBlock';
import { QuoteBlock } from './QuoteBlock';
import { ImageBlock } from './ImageBlock';

interface BlockRendererProps {
  block: Block;
  onUpdate: () => void;
  autoFocus?: boolean;
  isFocused?: boolean;
  textPlaceholder?: string;
  showSlashHint?: boolean;
  onDetectedMarkdownShortcut?: (type: MarkdownShortcutHintType) => void;
  onTransform: (blockId: number, newType: BlockType, newContent: string | null) => void;
  onFocusBlock?: () => void;
  onInsertBlockBelow: (blockId: number, type?: BlockType) => void;
  onDeleteBlock?: (block: Block) => void;
  onImagePress?: (content: ImageBlockContent) => void;
}

export function BlockRenderer({
  block,
  onUpdate,
  autoFocus,
  isFocused,
  textPlaceholder,
  showSlashHint,
  onDetectedMarkdownShortcut,
  onTransform,
  onFocusBlock,
  onInsertBlockBelow,
  onDeleteBlock,
  onImagePress,
}: BlockRendererProps) {
  switch (block.type) {
    case 'text':
      return (
        <TextBlock
          block={block}
          onUpdate={onUpdate}
          autoFocus={autoFocus}
          placeholder={textPlaceholder}
          showSlashHint={showSlashHint}
          onDetectedMarkdownShortcut={onDetectedMarkdownShortcut}
          onTransform={onTransform}
          onFocusBlock={onFocusBlock}
          onInsertBlockBelow={(type) => onInsertBlockBelow(block.id, type)}
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
          onInsertBlockBelow={(type) => onInsertBlockBelow(block.id, type)}
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
          onInsertBlockBelow={(type) => onInsertBlockBelow(block.id, type)}
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
          onInsertBlockBelow={(type) => onInsertBlockBelow(block.id, type)}
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
          onInsertBlockBelow={(type) => onInsertBlockBelow(block.id, type)}
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
          onInsertBlockBelow={(type) => onInsertBlockBelow(block.id, type)}
          onDelete={() => onDeleteBlock?.(block)}
        />
      );
    case 'image':
      return (
        <ImageBlock
          block={block}
          onUpdate={onUpdate}
          autoFocus={autoFocus}
          isFocused={isFocused}
          onTransform={onTransform}
          onFocusBlock={onFocusBlock}
          onInsertBlockBelow={(type) => onInsertBlockBelow(block.id, type)}
          onDelete={() => onDeleteBlock?.(block)}
          onImagePress={onImagePress}
        />
      );
    default:
      return null;
  }
}
