/** Chapter-level editorial study guides, not peer-reviewed papers or quotations from Tyndale. */
export interface ChapterReview {
  readonly book: 'Gen' | 'John';
  readonly chapter: number;
  readonly title: string;
  readonly overview: string;
  readonly interpretiveFocus: string;
  readonly keyVerses: readonly number[];
}

export const CHAPTER_REVIEWS: readonly ChapterReview[] = [
  {
    "book": "Gen",
    "chapter": 1,
    "title": "Creation and the ordered world",
    "overview": "God brings order and life into being, repeatedly pronouncing creation good; humanity receives a distinctive vocation as God's image-bearers.",
    "interpretiveFocus": "How should the opening Hebrew grammar be read? Interpretive traditions also differ on the literary structure and duration of the creation days.",
    "keyVerses": [
      1,
      3,
      26,
      27,
      31
    ]
  },
  {
    "book": "Gen",
    "chapter": 2,
    "title": "The garden and human vocation",
    "overview": "The narrative focuses on the human formed from dust, placed in a garden to cultivate and guard it, and joined with a suitable partner.",
    "interpretiveFocus": "How does this close-up account relate to chapter 1? The meaning of the tree, the command and the description of woman require attention to narrative context.",
    "keyVerses": [
      7,
      15,
      17,
      18,
      24
    ]
  },
  {
    "book": "Gen",
    "chapter": 3,
    "title": "Disobedience and exile",
    "overview": "The serpent's challenge leads to human disobedience, fractured relationships and expulsion; mortality and alienation frame the chapters that follow.",
    "interpretiveFocus": "What is the serpent's role, and how should the divine judgments be interpreted? Later Christian readings of verse 15 should be distinguished from its immediate context.",
    "keyVerses": [
      1,
      6,
      15,
      19,
      23
    ]
  },
  {
    "book": "Gen",
    "chapter": 4,
    "title": "Cain, Abel and spreading violence",
    "overview": "The first brothers' conflict culminates in murder, divine judgment and mercy; a genealogy juxtaposes cultural development with escalating violence.",
    "interpretiveFocus": "Why is Abel's offering accepted? The text gives clues but does not settle every proposed motive, while Cain's mark has often been misused.",
    "keyVerses": [
      4,
      7,
      10,
      15,
      26
    ]
  },
  {
    "book": "Gen",
    "chapter": 5,
    "title": "Generations from Adam to Noah",
    "overview": "A structured genealogy links Adam with Noah, stressing long lives, repeated deaths and the exceptional notice about Enoch.",
    "interpretiveFocus": "How do genealogical ages and formulas function in ancient literature? Compare the Enoch notice with the otherwise repeated refrain of death.",
    "keyVerses": [
      1,
      3,
      5,
      24,
      29
    ]
  },
  {
    "book": "Gen",
    "chapter": 6,
    "title": "Human corruption and Noah's calling",
    "overview": "Violence fills the earth, divine grief precedes judgment, and Noah is introduced as righteous in his generation and instructed to build the ark.",
    "interpretiveFocus": "The 'sons of God' and Nephilim are famously disputed; the text's relationship with ancient flood traditions also invites careful comparison.",
    "keyVerses": [
      2,
      5,
      8,
      11,
      18
    ]
  },
  {
    "book": "Gen",
    "chapter": 7,
    "title": "The flood and preservation",
    "overview": "The flood overwhelms the land while Noah's household and representative creatures survive inside the ark.",
    "interpretiveFocus": "How should the narrative's chronology, scope and repeated details be read? Distinguish literary and theological claims from modern geological proposals.",
    "keyVerses": [
      1,
      11,
      16,
      23
    ]
  },
  {
    "book": "Gen",
    "chapter": 8,
    "title": "Receding waters and renewed life",
    "overview": "The waters subside, Noah leaves the ark, offers sacrifice and receives a divine promise concerning the rhythms of the earth.",
    "interpretiveFocus": "How does the scene echo creation? The language about the human heart after the flood complicates simplistic claims that the disaster permanently removes evil.",
    "keyVerses": [
      1,
      15,
      20,
      21,
      22
    ]
  },
  {
    "book": "Gen",
    "chapter": 9,
    "title": "Covenant, the rainbow and human dignity",
    "overview": "God covenants with Noah and all living creatures, gives the rainbow as a sign, and addresses violence through the value of human life.",
    "interpretiveFocus": "How does this universal covenant relate to later biblical covenants? The account of Noah's sons requires care to avoid racist misreadings of the curse.",
    "keyVerses": [
      6,
      9,
      13,
      16,
      25
    ]
  },
  {
    "book": "Gen",
    "chapter": 10,
    "title": "The table of nations",
    "overview": "The nations are arranged genealogically and geographically, portraying the diversified world descended from Noah's sons.",
    "interpretiveFocus": "These genealogies combine kinship, peoples and territories rather than functioning as modern ethnic classifications. Their relationship to Babel's sequence is literary as well as chronological.",
    "keyVerses": [
      1,
      5,
      8,
      21,
      32
    ]
  },
  {
    "book": "Gen",
    "chapter": 11,
    "title": "Babel and the family of Abram",
    "overview": "Humanity seeks a name through a city and tower, language is confused, and the genealogical focus narrows to Abram's family.",
    "interpretiveFocus": "How does Babel critique collective ambition and self-exaltation? The transition to Abram is crucial for the subsequent promise to bless the nations.",
    "keyVerses": [
      4,
      7,
      9,
      26,
      31
    ]
  },
  {
    "book": "Gen",
    "chapter": 12,
    "title": "Abram's call and first journeys",
    "overview": "God commands Abram to leave his land, promising land, descendants and blessing for all families of the earth; the chapter ends with danger in Egypt.",
    "interpretiveFocus": "How should the promise be read alongside Abram's fearful conduct in Egypt? The repeated land-and-blessing pattern establishes the book's central narrative arc.",
    "keyVerses": [
      1,
      2,
      3,
      7,
      13
    ]
  },
  {
    "book": "Gen",
    "chapter": 13,
    "title": "Abram and Lot separate",
    "overview": "Abram and Lot part because their households have grown, and the land promise is renewed after Lot chooses the Jordan plain.",
    "interpretiveFocus": "What does Lot's choice reveal about the narrative's moral geography? Material prosperity and covenantal promise are deliberately contrasted.",
    "keyVerses": [
      8,
      10,
      14,
      15,
      18
    ]
  },
  {
    "book": "Gen",
    "chapter": 14,
    "title": "War of kings and Melchizedek",
    "overview": "Abram rescues Lot in a regional conflict and receives a blessing from Melchizedek, king of Salem and priest of God Most High.",
    "interpretiveFocus": "Melchizedek's identity and later biblical reception are contested; compare the scene's immediate political setting with its interpretation in Psalm 110 and Hebrews.",
    "keyVerses": [
      14,
      18,
      19,
      20,
      22
    ]
  },
  {
    "book": "Gen",
    "chapter": 15,
    "title": "Covenant and faith",
    "overview": "Abram trusts God's promise of descendants, and a dramatic covenant ceremony anticipates both oppression and eventual possession of the land.",
    "interpretiveFocus": "What does 'reckoned as righteousness' mean in context? Covenant-ritual imagery and later Pauline interpretation should be held together without conflating them.",
    "keyVerses": [
      5,
      6,
      13,
      17,
      18
    ]
  },
  {
    "book": "Gen",
    "chapter": 16,
    "title": "Hagar and Ishmael",
    "overview": "Sarai gives Hagar to Abram, conflict follows, and the divine messenger encounters Hagar in the wilderness.",
    "interpretiveFocus": "The chapter foregrounds unequal power, suffering and God's attention to Hagar. Assess later claims about Hagar without losing her voice in the narrative.",
    "keyVerses": [
      2,
      6,
      11,
      13,
      16
    ]
  },
  {
    "book": "Gen",
    "chapter": 17,
    "title": "Covenant and circumcision",
    "overview": "Abram becomes Abraham, Sarai becomes Sarah, circumcision is established as covenant sign, and Isaac is promised.",
    "interpretiveFocus": "How do covenant sign, identity and divine promise interrelate? The text distinguishes Ishmael's promised future from the particular covenant line of Isaac.",
    "keyVerses": [
      4,
      5,
      10,
      15,
      19
    ]
  },
  {
    "book": "Gen",
    "chapter": 18,
    "title": "Visitors, Sarah and intercession",
    "overview": "Three visitors announce Isaac's birth, and Abraham pleads for Sodom as divine justice and mercy are discussed.",
    "interpretiveFocus": "The visitors' identities and the relationship between divine foreknowledge and human intercession are interpreted differently across traditions.",
    "keyVerses": [
      10,
      14,
      19,
      23,
      25
    ]
  },
  {
    "book": "Gen",
    "chapter": 19,
    "title": "Sodom and Lot's escape",
    "overview": "The cities are judged after threats of violence and disregard for strangers; Lot's family escapes with lasting consequences.",
    "interpretiveFocus": "Interpretations of Sodom's sin must account for the actual narrative and later biblical references, including violence, injustice and inhospitality.",
    "keyVerses": [
      5,
      15,
      24,
      26,
      30
    ]
  },
  {
    "book": "Gen",
    "chapter": 20,
    "title": "Abraham and Abimelech",
    "overview": "Abraham again presents Sarah as his sister, and God protects her while Abimelech protests his innocence.",
    "interpretiveFocus": "What does this repetition contribute after the covenant promises? Moral responsibility, truth and divine protection remain in tension.",
    "keyVerses": [
      3,
      7,
      11,
      17
    ]
  },
  {
    "book": "Gen",
    "chapter": 21,
    "title": "Isaac's birth and Hagar's departure",
    "overview": "Isaac is born as promised; Hagar and Ishmael are sent away but receive divine protection, and Abraham makes a treaty at Beersheba.",
    "interpretiveFocus": "Read the painful household dynamics closely rather than treating the expulsion as straightforward moral approval. The competing futures of Isaac and Ishmael matter.",
    "keyVerses": [
      1,
      6,
      12,
      17,
      33
    ]
  },
  {
    "book": "Gen",
    "chapter": 22,
    "title": "Abraham's testing",
    "overview": "Abraham is commanded to offer Isaac and is stopped at the decisive moment; divine provision and the covenant promise frame the account.",
    "interpretiveFocus": "The ethics of the test and the meaning of divine provision have generated extensive Jewish and Christian interpretation. Later typological readings should not erase its difficulty.",
    "keyVerses": [
      2,
      8,
      12,
      14,
      18
    ]
  },
  {
    "book": "Gen",
    "chapter": 23,
    "title": "Sarah's death and burial",
    "overview": "Abraham negotiates and purchases a burial plot for Sarah, his first securely held property in the promised land.",
    "interpretiveFocus": "The repeated legal details establish public ownership and connect death, land and delayed promise rather than merely recounting a transaction.",
    "keyVerses": [
      2,
      4,
      16,
      19
    ]
  },
  {
    "book": "Gen",
    "chapter": 24,
    "title": "Rebekah and Isaac",
    "overview": "Abraham's servant seeks a wife for Isaac; Rebekah's hospitality and decision bring the covenant household into the next generation.",
    "interpretiveFocus": "How does providence operate through ordinary decisions? Rebekah's consent, kinship patterns and repeated retelling deserve attention.",
    "keyVerses": [
      12,
      14,
      27,
      58,
      67
    ]
  },
  {
    "book": "Gen",
    "chapter": 25,
    "title": "Abraham's death and the twins",
    "overview": "Abraham dies; Ishmael's line is recorded, and Esau sells his birthright to Jacob amid a prophecy about their futures.",
    "interpretiveFocus": "What is the relation between divine election, parental favoritism and human responsibility? The birthright episode prepares later conflict.",
    "keyVerses": [
      8,
      21,
      23,
      29,
      34
    ]
  },
  {
    "book": "Gen",
    "chapter": 26,
    "title": "Isaac's blessing and disputes",
    "overview": "God reaffirms the promises to Isaac, who navigates conflict with Abimelech and disputes over wells.",
    "interpretiveFocus": "The chapter deliberately echoes Abraham's life, asking how promise persists amid repetition, fear and contested access to resources.",
    "keyVerses": [
      3,
      4,
      12,
      22,
      24
    ]
  },
  {
    "book": "Gen",
    "chapter": 27,
    "title": "Jacob receives Isaac's blessing",
    "overview": "Rebekah and Jacob deceive the blind Isaac, and Esau loses the blessing intended for him.",
    "interpretiveFocus": "The narrative reports deception without requiring approval of it. Explore the distinction between foreknown promise and the family members' morally ambiguous actions.",
    "keyVerses": [
      19,
      27,
      33,
      38,
      41
    ]
  },
  {
    "book": "Gen",
    "chapter": 28,
    "title": "Jacob's dream at Bethel",
    "overview": "Fleeing from home, Jacob dreams of a stairway between heaven and earth and receives a renewed promise of land and presence.",
    "interpretiveFocus": "The precise image translated 'ladder' or 'stairway' is debated; God's pledge of presence frames the chapter more than Jacob's own bargaining.",
    "keyVerses": [
      12,
      13,
      15,
      17,
      22
    ]
  },
  {
    "book": "Gen",
    "chapter": 29,
    "title": "Jacob, Leah and Rachel",
    "overview": "Jacob meets Rachel, works for Laban, is deceived into marrying Leah and then Rachel, and Leah begins bearing sons.",
    "interpretiveFocus": "The chapter exposes the costs of favoritism and unequal affection. Consider how Laban's deception parallels Jacob's earlier actions.",
    "keyVerses": [
      18,
      23,
      25,
      31,
      35
    ]
  },
  {
    "book": "Gen",
    "chapter": 30,
    "title": "The growing family and flocks",
    "overview": "The competition for children continues and Jacob's flocks increase amid tense negotiations with Laban.",
    "interpretiveFocus": "Distinguish the characters' beliefs about fertility and breeding from what the narrator claims God does; the mandrakes and striped-rod episodes need this care.",
    "keyVerses": [
      14,
      22,
      25,
      37,
      43
    ]
  },
  {
    "book": "Gen",
    "chapter": 31,
    "title": "Jacob flees Laban",
    "overview": "Jacob leaves with his family and property, Laban pursues, and the two eventually establish a boundary covenant.",
    "interpretiveFocus": "What do the stolen household gods signify? The account presents disputed loyalties, exploitation and divine warning rather than an uncomplicated family reconciliation.",
    "keyVerses": [
      3,
      19,
      24,
      44,
      49
    ]
  },
  {
    "book": "Gen",
    "chapter": 32,
    "title": "Jacob wrestles at night",
    "overview": "Jacob prepares to meet Esau, prays for rescue, and wrestles with a mysterious figure before receiving the name Israel.",
    "interpretiveFocus": "Whether the opponent is an angel, divine manifestation or literary mystery is debated. The bodily wound and blessing resist a simple triumphal reading.",
    "keyVerses": [
      9,
      11,
      24,
      28,
      30
    ]
  },
  {
    "book": "Gen",
    "chapter": 33,
    "title": "Jacob and Esau reconcile",
    "overview": "The brothers meet peacefully after years of estrangement, and Jacob settles in the land.",
    "interpretiveFocus": "Esau's gracious reception contrasts with Jacob's expectations; whether their reconciliation is complete remains an interpretive question.",
    "keyVerses": [
      4,
      10,
      14,
      17,
      20
    ]
  },
  {
    "book": "Gen",
    "chapter": 34,
    "title": "Dinah and Shechem",
    "overview": "Dinah is violated, and Simeon and Levi answer with deceit and mass violence, provoking Jacob's fear.",
    "interpretiveFocus": "The chapter requires exceptional ethical caution: do not confuse the narrator's description of sexual violence and revenge with endorsement of either.",
    "keyVerses": [
      2,
      7,
      13,
      25,
      30
    ]
  },
  {
    "book": "Gen",
    "chapter": 35,
    "title": "Return to Bethel and family losses",
    "overview": "Jacob renews worship at Bethel, Rachel dies giving birth to Benjamin, and Isaac dies as the family genealogy continues.",
    "interpretiveFocus": "Reaffirmation of identity and land promise stands alongside bereavement and household disorder; the narrative links sacred places with costly transitions.",
    "keyVerses": [
      2,
      10,
      12,
      18,
      29
    ]
  },
  {
    "book": "Gen",
    "chapter": 36,
    "title": "Esau's descendants",
    "overview": "A lengthy genealogy details Esau's household, chiefs and kings in Edom.",
    "interpretiveFocus": "Why preserve a genealogy outside Jacob's line? It shows the fulfillment of promises concerning Esau and situates Israel among related peoples.",
    "keyVerses": [
      1,
      8,
      9,
      31,
      43
    ]
  },
  {
    "book": "Gen",
    "chapter": 37,
    "title": "Joseph's dreams and sale",
    "overview": "Joseph's favored status and dreams intensify his brothers' jealousy; he is sold and Jacob believes he has died.",
    "interpretiveFocus": "The narrative neither excuses Joseph's brothers nor entirely suppresses tensions around favoritism. Dreams begin a long pattern of providence.",
    "keyVerses": [
      3,
      5,
      18,
      28,
      35
    ]
  },
  {
    "book": "Gen",
    "chapter": 38,
    "title": "Judah and Tamar",
    "overview": "Judah's treatment of Tamar leads to a disguised encounter and a belated admission of wrongdoing.",
    "interpretiveFocus": "The legal and social vulnerability of a widow is essential to interpreting the episode; Judah's recognition is a narrative turning point.",
    "keyVerses": [
      11,
      14,
      18,
      26,
      29
    ]
  },
  {
    "book": "Gen",
    "chapter": 39,
    "title": "Joseph in Potiphar's house",
    "overview": "Joseph prospers as a servant, resists a coercive sexual situation and is imprisoned after a false accusation.",
    "interpretiveFocus": "Repeated statements that the Lord is with Joseph are crucial; apparent injustice does not cancel the narrator's account of divine presence.",
    "keyVerses": [
      2,
      9,
      20,
      21,
      23
    ]
  },
  {
    "book": "Gen",
    "chapter": 40,
    "title": "Dreams in prison",
    "overview": "Joseph interprets the dreams of Pharaoh's officials, whose different outcomes are fulfilled while Joseph remains forgotten.",
    "interpretiveFocus": "The chapter raises questions about divine revelation and human memory, preparing the reversal that follows.",
    "keyVerses": [
      8,
      12,
      19,
      22,
      23
    ]
  },
  {
    "book": "Gen",
    "chapter": 41,
    "title": "Joseph rises in Egypt",
    "overview": "Joseph interprets Pharaoh's dreams, proposes storage during abundance and becomes administrator over Egypt.",
    "interpretiveFocus": "How should his administrative power and economic policy be evaluated? The narrative emphasizes divine wisdom and preparedness but leaves later consequences to unfold.",
    "keyVerses": [
      16,
      25,
      32,
      39,
      57
    ]
  },
  {
    "book": "Gen",
    "chapter": 42,
    "title": "The first journey of Joseph's brothers",
    "overview": "Famine brings Joseph's brothers to Egypt, where he recognizes and tests them without revealing himself.",
    "interpretiveFocus": "The brothers begin reckoning with their past violence; conscience and providence emerge through suspense rather than immediate forgiveness.",
    "keyVerses": [
      6,
      21,
      24,
      28,
      36
    ]
  },
  {
    "book": "Gen",
    "chapter": 43,
    "title": "Benjamin's journey to Egypt",
    "overview": "The brothers return with Benjamin, Judah guarantees his safety, and Joseph struggles with emotion as he hosts them.",
    "interpretiveFocus": "Judah's responsibility contrasts with his earlier conduct; generosity and suspicion coexist as the test intensifies.",
    "keyVerses": [
      9,
      14,
      23,
      29,
      30
    ]
  },
  {
    "book": "Gen",
    "chapter": 44,
    "title": "The silver cup and Judah's appeal",
    "overview": "Joseph's cup is found with Benjamin, and Judah offers himself in Benjamin's place.",
    "interpretiveFocus": "Judah's speech revisits the family's wound and marks a moral reversal; identify what has changed since the sale of Joseph.",
    "keyVerses": [
      16,
      18,
      30,
      33,
      34
    ]
  },
  {
    "book": "Gen",
    "chapter": 45,
    "title": "Joseph reveals himself",
    "overview": "Joseph discloses his identity, forgives his brothers and interprets his journey through providence during famine.",
    "interpretiveFocus": "His claim that God sent him ahead does not remove the brothers' responsibility. Compare divine purpose with human wrongdoing in his words.",
    "keyVerses": [
      3,
      5,
      7,
      8,
      15
    ]
  },
  {
    "book": "Gen",
    "chapter": 46,
    "title": "Jacob travels to Egypt",
    "overview": "Jacob receives reassurance on the journey and reunites with Joseph amid a detailed register of the household.",
    "interpretiveFocus": "The move to Egypt secures survival while preparing for Israel's later bondage; a family list becomes a bridge between major biblical narratives.",
    "keyVerses": [
      3,
      4,
      27,
      29,
      34
    ]
  },
  {
    "book": "Gen",
    "chapter": 47,
    "title": "The family settles in Goshen",
    "overview": "Jacob's family settles in Egypt, while Joseph's famine policy transfers land and labor into Pharaoh's control.",
    "interpretiveFocus": "The ethical implications of economic centralization deserve scrutiny, even though the narrative describes Joseph as effective in the crisis.",
    "keyVerses": [
      9,
      12,
      20,
      23,
      27
    ]
  },
  {
    "book": "Gen",
    "chapter": 48,
    "title": "Jacob blesses Ephraim and Manasseh",
    "overview": "Jacob adopts Joseph's sons and deliberately gives the younger Ephraim precedence over Manasseh.",
    "interpretiveFocus": "The surprising reversal continues Genesis's theme of blessing overturning expected birth order; Jacob acts intentionally rather than mistakenly.",
    "keyVerses": [
      5,
      14,
      19,
      20,
      22
    ]
  },
  {
    "book": "Gen",
    "chapter": 49,
    "title": "Jacob's words over his sons",
    "overview": "Jacob pronounces poetic blessings and judgments over his sons, anticipating tribal identities and futures.",
    "interpretiveFocus": "The oracle for Judah and the references to royal rule have extensive interpretive histories; poetic language should not be flattened into simple predictions.",
    "keyVerses": [
      1,
      8,
      10,
      22,
      33
    ]
  },
  {
    "book": "Gen",
    "chapter": 50,
    "title": "Burial, forgiveness and hope",
    "overview": "Jacob is buried in Canaan, Joseph reassures his fearful brothers, and the book ends with hope for God's future visitation.",
    "interpretiveFocus": "Joseph's words distinguish divine redemption from evil intentions. The final request concerning his bones points beyond Genesis toward Exodus.",
    "keyVerses": [
      19,
      20,
      24,
      25,
      26
    ]
  },
  {
    "book": "John",
    "chapter": 1,
    "title": "The Word becomes flesh",
    "overview": "The prologue identifies the Word with God and creation, then presents Jesus as the incarnate revelation of God; witnesses begin identifying him.",
    "interpretiveFocus": "The Greek of verse 1, the meaning of logos and the relation between divine identity and incarnation have a long exegetical history.",
    "keyVerses": [
      1,
      3,
      14,
      18,
      29,
      51
    ]
  },
  {
    "book": "John",
    "chapter": 2,
    "title": "Cana and the temple",
    "overview": "Jesus transforms water into wine at Cana and challenges trade in the Jerusalem temple, presenting two signs of renewal.",
    "interpretiveFocus": "How does the reference to Jesus' 'hour' shape the first sign? The temple saying is interpreted retrospectively in light of resurrection.",
    "keyVerses": [
      5,
      11,
      16,
      19,
      21,
      22
    ]
  },
  {
    "book": "John",
    "chapter": 3,
    "title": "Nicodemus and new birth",
    "overview": "Jesus speaks of birth from above, Spirit and eternal life; John the Baptist describes Jesus' growing prominence.",
    "interpretiveFocus": "The Greek anōthen can mean 'again' or 'from above'. The voice and scope of the words around 3:16 and the meaning of water and Spirit remain debated.",
    "keyVerses": [
      3,
      5,
      8,
      16,
      30
    ]
  },
  {
    "book": "John",
    "chapter": 4,
    "title": "Samaritan woman and healing",
    "overview": "Jesus crosses social boundaries in conversation with a Samaritan woman and later heals an official's son.",
    "interpretiveFocus": "The account juxtaposes living water, worship and testimony. Read Samaritan history and the woman's social situation without assuming what is not stated.",
    "keyVerses": [
      10,
      14,
      23,
      26,
      42,
      50
    ]
  },
  {
    "book": "John",
    "chapter": 5,
    "title": "Healing and authority",
    "overview": "A healing at the pool provokes dispute over Sabbath observance, followed by Jesus' claims about the Father's work and witness.",
    "interpretiveFocus": "How do divine agency, resurrection and judgment operate in the discourse? Attention to manuscript variation at the pool scene is also relevant.",
    "keyVerses": [
      8,
      17,
      19,
      24,
      39
    ]
  },
  {
    "book": "John",
    "chapter": 6,
    "title": "Bread of life",
    "overview": "After feeding a crowd and walking on water, Jesus identifies himself as the bread of life and divides his hearers.",
    "interpretiveFocus": "The discourse raises questions about manna, faith and Eucharistic interpretation; traditions differ on how literally to read eating flesh and drinking blood.",
    "keyVerses": [
      11,
      20,
      35,
      44,
      53,
      68
    ]
  },
  {
    "book": "John",
    "chapter": 7,
    "title": "Jesus at the festival",
    "overview": "Jesus teaches at the festival amid conflict over identity, origins and authority; he promises living water.",
    "interpretiveFocus": "The 'living water' saying has rich Spirit imagery. The placement and textual status of 7:53–8:11 must be assessed through manuscript evidence.",
    "keyVerses": [
      16,
      24,
      37,
      38,
      39
    ]
  },
  {
    "book": "John",
    "chapter": 8,
    "title": "Light, freedom and contested identity",
    "overview": "Jesus calls himself the light of the world and debates sin, slavery, Abraham and divine identity.",
    "interpretiveFocus": "Interpret the 'I am' saying in its Jewish scriptural setting, and distinguish the narrative's particular opponents from Jewish people as a whole.",
    "keyVerses": [
      12,
      31,
      32,
      44,
      58
    ]
  },
  {
    "book": "John",
    "chapter": 9,
    "title": "The man born blind",
    "overview": "Jesus heals a man blind from birth, and escalating questioning exposes different kinds of sight and blindness.",
    "interpretiveFocus": "The opening rejects simplistic blame for disability. The narrative uses irony and social exclusion to develop its theological argument.",
    "keyVerses": [
      3,
      7,
      25,
      35,
      39
    ]
  },
  {
    "book": "John",
    "chapter": 10,
    "title": "Shepherd and sheep",
    "overview": "Jesus depicts himself as the gate and good shepherd, laying down his life for the sheep.",
    "interpretiveFocus": "The shepherd imagery echoes biblical critiques of failed leaders. The 'one' language about Father and Son merits close reading in context.",
    "keyVerses": [
      9,
      11,
      16,
      18,
      30
    ]
  },
  {
    "book": "John",
    "chapter": 11,
    "title": "Lazarus raised",
    "overview": "Jesus raises Lazarus, evokes faith and grief, and heightens the leaders' decision to seek his death.",
    "interpretiveFocus": "How should 'resurrection and life' be understood alongside Jesus' tears? The narrative links a life-giving sign to his own impending death.",
    "keyVerses": [
      25,
      26,
      35,
      43,
      47,
      53
    ]
  },
  {
    "book": "John",
    "chapter": 12,
    "title": "Anointing and the hour",
    "overview": "Mary anoints Jesus, Jesus enters Jerusalem and announces that his hour has come as crowds and leaders react.",
    "interpretiveFocus": "The seed that dies shapes John's theology of glory. Different responses to the signs illuminate belief, public allegiance and fear.",
    "keyVerses": [
      3,
      13,
      23,
      24,
      32
    ]
  },
  {
    "book": "John",
    "chapter": 13,
    "title": "Foot-washing and betrayal",
    "overview": "Jesus washes his disciples' feet, identifies a betrayer and commands the disciples to love one another.",
    "interpretiveFocus": "The washing combines humble example and symbolic participation with Jesus; compare cleansing, service and the new commandment.",
    "keyVerses": [
      8,
      14,
      15,
      21,
      34,
      35
    ]
  },
  {
    "book": "John",
    "chapter": 14,
    "title": "Comfort, the way and the Advocate",
    "overview": "Jesus comforts his disciples, describes himself as the way to the Father and promises the Spirit's presence.",
    "interpretiveFocus": "Different traditions discuss the relation between the Son, Father and Spirit, as well as the meaning of works and prayer in Jesus' name.",
    "keyVerses": [
      6,
      9,
      16,
      26,
      27
    ]
  },
  {
    "book": "John",
    "chapter": 15,
    "title": "Vine, friendship and witness",
    "overview": "Jesus calls his disciples to abide in him, bear fruit and love one another amid the world's opposition.",
    "interpretiveFocus": "The vine evokes Israel imagery; how should branches, fruit and pruning be understood within the farewell discourse?",
    "keyVerses": [
      1,
      4,
      5,
      12,
      16,
      26
    ]
  },
  {
    "book": "John",
    "chapter": 16,
    "title": "Sorrow turned to joy",
    "overview": "Jesus predicts hostility, promises the Advocate's work and anticipates grief transformed into joy.",
    "interpretiveFocus": "The Spirit's work of convicting the world and guiding into truth invites interpretive questions; the speech addresses the disciples' specific circumstances.",
    "keyVerses": [
      7,
      8,
      13,
      20,
      33
    ]
  },
  {
    "book": "John",
    "chapter": 17,
    "title": "Jesus' prayer",
    "overview": "Jesus prays for his glorification, his disciples and future believers, linking unity with the Father's love.",
    "interpretiveFocus": "The meaning of 'one' and the relation between unity, truth and mission require careful contextual and ecclesial interpretation.",
    "keyVerses": [
      3,
      11,
      17,
      20,
      21,
      24
    ]
  },
  {
    "book": "John",
    "chapter": 18,
    "title": "Arrest and trial",
    "overview": "Jesus is arrested, Peter denies him, and Jesus stands before religious and Roman authorities.",
    "interpretiveFocus": "John emphasizes Jesus' composure and kingship. Compare this account with the Synoptic trial narratives without assuming identical chronology or emphasis.",
    "keyVerses": [
      4,
      11,
      17,
      36,
      37,
      38
    ]
  },
  {
    "book": "John",
    "chapter": 19,
    "title": "Crucifixion and burial",
    "overview": "Pilate hands Jesus over to be crucified; Jesus dies, his side is pierced and he is buried.",
    "interpretiveFocus": "The chronology of Passover, the scriptural fulfillment motifs and 'It is finished' are major subjects of historical and theological discussion.",
    "keyVerses": [
      5,
      19,
      26,
      30,
      34,
      38
    ]
  },
  {
    "book": "John",
    "chapter": 20,
    "title": "Empty tomb and appearances",
    "overview": "Mary Magdalene and the disciples encounter the risen Jesus, Thomas confesses faith, and the Gospel states its purpose.",
    "interpretiveFocus": "Why are some appearances narrated in detail? Thomas' confession and the closing purpose statement locate the signs within the Gospel's argument.",
    "keyVerses": [
      16,
      22,
      28,
      29,
      30,
      31
    ]
  },
  {
    "book": "John",
    "chapter": 21,
    "title": "Breakfast and restoration",
    "overview": "The risen Jesus meets the disciples at the lake, commissions Peter and closes with testimony about the beloved disciple.",
    "interpretiveFocus": "The threefold question to Peter is frequently read against his denials; debates about authorship and the Gospel's epilogue should be distinguished from the story's message.",
    "keyVerses": [
      7,
      15,
      17,
      19,
      24,
      25
    ]
  }
];

/** All 50 chapters of Genesis and all 21 chapters of John. */
export function reviewForChapter(book: string, chapter: number): ChapterReview | null {
  return CHAPTER_REVIEWS.find((item) => item.book === book && item.chapter === chapter) ?? null;
}
