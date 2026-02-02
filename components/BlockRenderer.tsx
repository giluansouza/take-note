import { Block } from '@/lib/blocks.repository';
import { TextBlock } from './TextBlock';
import { ChecklistBlock } from './ChecklistBlock';
import { ListBlock } from './ListBlock';

interface BlockRendererProps {
  block: Block;
  onUpdate: () => void;
}

export function BlockRenderer({ block, onUpdate }: BlockRendererProps) {
  switch (block.type) {
    case 'text':
      return <TextBlock block={block} onUpdate={onUpdate} />;
    case 'checklist':
      return <ChecklistBlock block={block} onUpdate={onUpdate} />;
    case 'list':
      return <ListBlock block={block} onUpdate={onUpdate} />;
    default:
      return null;
  }
}
