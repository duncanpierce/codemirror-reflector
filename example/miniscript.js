// This file was generated by lezer-generator. You probably shouldn't edit it.
import {LRParser} from "@lezer/lr"
import {scope, structure, definition, use} from "../src/props"
const spec_identifier = {__proto__:null,func:76, var:88, return:112}
export const parser = LRParser.deserialize({
  version: 14,
  states: "*UQYQPOOOOQO'#C`'#C`OOQO'#Ch'#ChObQPO'#C_OgQPO'#CwOOQO'#DQ'#DQOOQO'#Cy'#CyQYQPOOOOQO'#Ca'#CaOlQPO,58yOOQO'#Cx'#CxOqQPO,59cOOQO-E6w-E6wOvQPO'#DTOOQO'#Cc'#CcO!OQPO'#CbOOQO1G.e1G.eOOQO1G.}1G.}OOQO'#Cd'#CdOOQO,59o,59oO!TQPO,59oO!]QPO'#CeOOQO,58|,58|O!kQPO'#CzO!pQPO1G/ZOOQO1G/Z1G/ZO!xQPO'#CgO!}QPO'#CkO#{QPO'#CrO$QQPO'#CjOOQO'#Cv'#CvO$VQPO'#CuO$hQPO'#CfOOQO'#C{'#C{O$mQPO,59POOQO,59P,59POOQO,59f,59fOOQO-E6x-E6xOOQO7+$u7+$uOOQO'#Ci'#CiOOQO,59R,59RO${QPO'#DeOOQO'#Ct'#CtOOQO,59^,59^O$VQPO,59UO$VQPO'#CoO%tQPO,59aO$VQPO'#CqOOQO'#Cl'#ClOOQO,59Q,59QOOQO-E6y-E6yOOQO1G.k1G.kO%{QPO,5:POOQO,5:P,5:PO&VQPO1G.pOOQO,59Z,59ZO$VQPO,59[O$VQPO,59[O$VQPO,59[O&^QPO,59]O$VQPO'#C|O&eQPO1G/kOOQO1G/k1G/kOOQO1G.v1G.vO'bQPO1G.vO'lQPO1G.vOOQO1G.w1G.wO'vQPO,59hOOQO-E6z-E6zOOQO7+%V7+%V",
  stateData: "(Q~OsOSPOS~OvPO|QO~OuWO~OuYO~Ox]O~O!ZaO~OubOzcO~O{eO~OygOziO~OukO|QO!YnO![sO~OubO~OygOzvO~OuwO~OxgX}_X!O_X!P_X!Q_X!R_X!S_X!T_X!U_X!V_X!W_X!Z_Xy_Xz_X~OxyO~O}|O~Oa!QOb!QOukOx!PO!O}O~O!Z!RO~OukO|QO!YnO![!TO~Oz!VO~P$VO}![O!O!ZO!P!YO!Q!YO!R!ZO!S![O!T![O!U![O!V![O!W![O~O!Zia~P%SOy!^Oz!`O~P%SO!Z^i~P%SOz!dO~P%SOy!^Oz!gO~O!P!YO!Q!YO}di!Sdi!Tdi!Udi!Vdi!Wdi!Zdiydizdi~O!Odi!Rdi~P&mO!O!ZO!R!ZO~P&mOypazpa~P%SO",
  goto: "%p!YPPP!Z!_!c!f!i!l!r!u!y!}#V!y#Y#iPP#^#^#^$U$e$r!y$u!Z$y$|%S%Y%`PPP%fPP%jPPPPPPPPPPPPPPP%mTTOVTROVRXRR`XR_XQd]RtgRf_TqerTperSSOVTjerRxjSmerc!Qoy|}!P!Y!Z![!^Q!OoQ!UyQ!W|Q!X}Q!]!PQ!a!YQ!b!ZQ!c![R!e!^Sperc!Qoy|}!P!Y!Z![!^gleory|}!P!Y!Z![!^R{lToerRZSQVOR[VQhdRuhQreR!SrQ!_!UR!f!_TUOVR^XRzl",
  nodeNames: "⚠ Comment Program FunctionDeclaration Function FunctionDefinition FunctionScope FormalParameters ParameterDefinition Block Statement LocalVariableDeclaration Var LocalVariableDefinition Assignment VariableUse Expression Number String Unary Binary SubExpression FunctionCall FunctionUse ActualParameters ReturnStatement Return GlobalVariableDeclaration GlobalVariableDefinition",
  maxTerm: 58,
  nodeProps: [
    [scope, -3,2,6,9,""],
    [structure, -3,3,10,27,""],
    [definition, -3,5,8,28,"wholeScope",13,"redefines,overridePrevious"],
    [use, -2,15,23,""]
  ],
  skippedNodes: [0,1],
  repeatNodeCount: 4,
  tokenData: "&i~RfXY!gYZ!g]^!gpq!grs!xst#mxy$Uyz$Zz{$`{|$e|}$j}!O$o!P!Q$t!Q![$y!]!^%R!^!_%W!_!`%m!`!a%r!c!}&P#T#o&P#o#p&_#q#r&d~!lSs~XY!gYZ!g]^!gpq!g~!{TOY#[Zr#[s;'S#[;'S;=`#g<%lO#[~#_Prs#b~#gOb~~#jP;=`<%l#[~#rSP~OY#mZ;'S#m;'S;=`$O<%lO#m~$RP;=`<%l#m~$ZOx~~$`Oz~~$eO!P~~$jO!R~~$oOy~~$tO!O~~$yO!Q~~%OPa~!Q![$y~%WO!Z~~%]Q!S~!_!`%c!`!a%h~%hO!V~~%mO!U~~%rO}~~%wP!T~!_!`%z~&PO!W~~&URu~!Q![&P!c!}&P#T#o&P~&dO{~~&iO![~",
  tokenizers: [0],
  topRules: {"Program":[0,2]},
  specialized: [{term: 37, get: (value) => spec_identifier[value] || -1}],
  tokenPrec: 0
})
