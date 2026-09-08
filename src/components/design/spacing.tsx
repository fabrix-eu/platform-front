import type { ReactNode } from 'react';

/*
 * Spacing — the rules the Learning Hub migration forced into the open.
 * Raising the type scale there without touching the spacing broke all three of
 * them at once, so they are shown here as the before/after they actually were.
 * Every "wrong" panel is a measurement taken off the real page, not a strawman.
 */

function Compare({
  rule,
  why,
  wrong,
  right,
  wrongLabel,
  rightLabel,
}: {
  rule: string;
  why: string;
  wrong: ReactNode;
  right: ReactNode;
  wrongLabel: string;
  rightLabel: string;
}) {
  return (
    <div className="border-t border-fx-line py-8 first:border-t-0 first:pt-0">
      <h3 className="font-fx-display text-fx-heading text-fx-ink">{rule}</h3>
      <p className="mt-2 max-w-2xl text-fx-body text-fx-ink2">{why}</p>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div>
          <p className="mb-2 font-fx-display text-fx-label text-fx-orange uppercase">{wrongLabel}</p>
          {wrong}
        </div>
        <div>
          <p className="mb-2 font-fx-display text-fx-label text-fx-green uppercase">{rightLabel}</p>
          {right}
        </div>
      </div>
    </div>
  );
}

/** A card whose padding is set in px, so the two versions differ by that alone. */
function Card({ pad }: { pad: number }) {
  return (
    <div className="rounded-fx border border-fx-line bg-fx-paper" style={{ padding: `${pad}px` }}>
      <h4 className="font-fx-display text-fx-heading text-fx-ink">Woven cotton roll-ends</h4>
      <p className="mt-2 text-fx-small text-fx-ink2">
        Regular surplus from our weaving line — natural and dyed cotton, sold by weight, collected
        monthly from Rotterdam.
      </p>
    </div>
  );
}

function Prose({ gap }: { gap: number }) {
  return (
    <div className="rounded-fx border border-fx-line bg-fx-paper p-6">
      <p className="text-[17px] leading-[1.68] text-fx-ink2">
        European environmental legislation has shifted from regulating the footprint of factories to
        regulating the product itself.
      </p>
      <p className="text-[17px] leading-[1.68] text-fx-ink2" style={{ marginTop: `${gap}px` }}>
        Under the Ecodesign regulation, items placed on the market must be climate-neutral and
        resource-efficient, tracked through indirect indicators.
      </p>
    </div>
  );
}

function Heading({ before, after }: { before: number; after: number }) {
  return (
    <div className="rounded-fx border border-fx-line bg-fx-paper p-6">
      <p className="text-[17px] leading-[1.68] text-fx-ink2">
        …tracked through indirect indicators such as provenance and repairability.
      </p>
      <h4
        className="font-fx-display text-fx-heading text-fx-ink"
        style={{ marginTop: `${before}px`, marginBottom: `${after}px` }}
      >
        Architecture of the passport
      </h4>
      <p className="text-[17px] leading-[1.68] text-fx-ink2">
        A standardized dataset linked to an individual product identifier, readable without
        proprietary software.
      </p>
    </div>
  );
}

export function SpacingRules() {
  return (
    <div className="rounded-fx-lg border border-fx-line bg-fx-panel px-8 py-2">
      <Compare
        rule="Padding is at least the line-height of the text inside it"
        why="A card set at 14px body has a 20px line. 16px of padding puts the text closer to the border than its own lines are to each other, and the block reads as cramped however good the type is."
        wrongLabel="16px padding · 20px line"
        rightLabel="20px padding"
        wrong={<Card pad={16} />}
        right={<Card pad={20} />}
      />
      <Compare
        rule="The gap between paragraphs beats the gap between lines"
        why="Body copy at 17/1.68 puts 28.6px between lines. At 16px between paragraphs — the value we shipped — the paragraph break is tighter than the line break, so a column of text reads as one undifferentiated block."
        wrongLabel="16px between paragraphs"
        rightLabel="26px between paragraphs"
        wrong={<Prose gap={16} />}
        right={<Prose gap={26} />}
      />
      <Compare
        rule="A heading belongs to what follows it"
        why="Equal space above and below a heading leaves it floating between two sections. The space above separates; the space below must not — it attaches the heading to the text it introduces."
        wrongLabel="Equal space, both sides"
        rightLabel="Large above, small below"
        wrong={<Heading before={26} after={26} />}
        right={<Heading before={48} after={13} />}
      />
    </div>
  );
}
