import styles from './BoneGuide.module.css';

// The evidence behind the plan, in plain language, each claim linked to its
// source (docs/specs/program-v2.md has the full table). Collapsed by default:
// it's there to be read once and checked later, not to sit in the way.

const SRC = {
  swan: { label: 'Greendale et al. 2012, SWAN', href: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3378821/' },
  uspstf: { label: 'USPSTF, January 2025', href: 'https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/osteoporosis-screening' },
  stopem: { label: 'STOP-EM trial protocol, BMJ Open 2025', href: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11800298/' },
  nams: { label: 'The Menopause Society, 2022 position statement', href: 'https://pubmed.ncbi.nlm.nih.gov/35797481/' },
  uk: { label: 'UK consensus “Strong, steady and straight”, 2022', href: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9304091/' },
  creatine: { label: 'Chilibeck et al. 2023, two-year creatine trial', href: 'https://www.nutraingredients.com/Article/2023/10/17/creatine-shows-no-effect-on-postmenopausal-bone-mineral-density' },
  liftmor: { label: 'Watson et al. 2018, LIFTMOR', href: 'https://pubmed.ncbi.nlm.nih.gov/28975661/' },
};

function Sources({ ids }) {
  return (
    <p className={styles.sources}>
      {ids.length === 1 ? 'Source: ' : 'Sources: '}
      {ids.map((id, i) => (
        <span key={id}>
          {i > 0 && '; '}
          <a href={SRC[id].href} target="_blank" rel="noreferrer">{SRC[id].label}</a>
        </span>
      ))}
    </p>
  );
}

function Section({ title, children }) {
  return (
    <details className={styles.section}>
      <summary className={styles.summary}>{title}</summary>
      <div className={styles.body}>{children}</div>
    </details>
  );
}

export function BoneGuide() {
  return (
    <div className={styles.guide}>
      <Section title="Why now">
        <p>
          In SWAN, a long-running study of the menopause transition, bone loss
          began about a year before the final period and was fastest for the
          three years from then: about 2.5% a year at the spine, roughly 7% in
          all. After that it slowed, but didn’t stop.
        </p>
        <p>
          Lifting and impact work before and through that window is what this
          plan is for.
        </p>
        <Sources ids={['swan']} />
      </Section>

      <Section title="What a bone scan can and can’t tell you">
        <p>
          US guidance recommends routine DEXA scans from 65, or earlier after
          menopause for people at higher risk: low body weight, a parent who
          broke a hip, smoking, or heavy drinking. There’s no routine scan
          before then. If any of those apply, or you’ve broken a bone in a
          minor fall, ask your doctor whether one makes sense now.
        </p>
        <p>
          Don’t judge the plan by a scan. On average, exercise moves DEXA
          numbers by less than 1% at the spine, yet the meta-analyses STOP-EM
          cites find it cuts fracture risk by more than 60%. Stronger muscles,
          better balance and better bone structure don’t all show up as density.
        </p>
        <Sources ids={['uspstf', 'stopem']} />
      </Section>

      <Section title="The biggest lever is a conversation with your doctor">
        <p>
          Training is the part you control day to day. The strongest protection
          for bone through menopause is hormone therapy: The Menopause Society
          finds it prevents bone loss and fracture, and that for people under 60
          or within 10 years of menopause, without reasons to avoid it, the
          benefits outweigh the risks. Whether it’s right for you is for you and
          your doctor to decide.
        </p>
        <Sources ids={['nams']} />
      </Section>

      <Section title="If you take hormones">
        <p>
          Nearly all of this research enrolled cisgender women. If you take
          testosterone or other hormones, your bone picture may be different,
          and there’s little research to go on, so that’s a question for your
          doctor. The training principles still apply: heavy, progressive
          lifting and regular impact.
        </p>
      </Section>

      <Section title="Food">
        <p>
          The UK and Australian bone-health position statements pair exercise
          with enough calcium and vitamin D. Food first; ask your doctor before
          adding a supplement.
        </p>
        <p>
          Eat some protein at every meal. Research on exact amounts around
          menopause is thin, so Wolfram doesn’t give you a number.
        </p>
        <p>
          Creatine isn’t worth taking for bone: a two-year trial in 237 people
          after menopause found no benefit to bone density.
        </p>
        <Sources ids={['uk', 'creatine']} />
      </Section>

      <Section title="Where this plan comes from">
        <p>
          The gym program copies the design of STOP-EM, a Canadian trial built
          for the menopause transition. It runs a month of learning the lifts,
          a building phase, then heavy sets of five, finishing every session
          with drop landings. Its results aren’t out yet, so no trial has shown
          what heavy lifting does during perimenopause specifically.
        </p>
        <p>
          The jump dose, about 50 on most days, follows the Australian and UK
          bone-health guidance. The evidence that heavy lifting builds bone
          comes from after menopause: in LIFTMOR, twice-weekly heavy sets of
          five plus jumping chin-ups with drop landings raised spine density by
          2.9% over 8 months, while the comparison group lost 1.2%.
        </p>
        <Sources ids={['stopem', 'uk', 'liftmor']} />
      </Section>
    </div>
  );
}
