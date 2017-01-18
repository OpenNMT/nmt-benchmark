#!/usr/bin/perl -w

# $Id: multi-bleu.perl 1307 2007-03-14 22:22:36Z hieuhoang1972 $
use strict;

my $norm=0;

if ($ARGV[0] eq "-norm") {
    # normalization of words to perform rapport_connection = rapport
    $norm=1;
    shift @ARGV;
}

my $stem = $ARGV[0];
if (!defined $stem) {
  print STDERR "usage: multi-bleu.pl [-norm] reference.filestem < hypothesis\n";
  print STDERR "Reads the references from reference.filestem.0, reference.filestem.1, ...\n";
  exit(1);
}

my @REF;
my $ref=0;
while(-e "$stem$ref") {
    &add_to_ref("$stem$ref",\@REF);
    $ref++;
}
&add_to_ref($stem,\@REF) if -e $stem;

sub add_to_ref {
    my ($file,$REF) = @_;
    my $s=0;
    open(REF,$file) or die "Can't read $file";
    while(<REF>) {
	chop;
	push @{$$REF[$s++]}, $_;
    }
    close(REF);
}

my @HYP=<STDIN>;

my $SCORE=calculate_bleu();
$SCORE=~/BLEU = (.*?),/;
my $BLEU=$1;
my $ecart=0;

my $sample=20;
my $s=($#HYP+1);
for(my $n=0;$n<$sample;$n++) {
    my $sc=calculate_bleu(($n*$s)/$sample,(($n+1)*$s)/$sample);
    $sc=~/BLEU = (.*?),/;
    if (abs($1-$BLEU)>$ecart) { $ecart=abs($1-$BLEU); }
}
$ecart=sprintf("%.2f",$ecart);
$SCORE=~s/(BLEU = .*?),/$1 +\/- $ecart,/;
print $SCORE;

sub calculate_bleu {
    my ($min,$max)=@_;
    my(@CORRECT,@TOTAL,$length_translation,$length_reference);
    my $s=0;
    my $reals=0;
    foreach my $l (@HYP) {
	my $L=$l;
	chomp $L;
	if (defined($min) && ($s>=$min && $s<$max)) { $s++; next; }
	my @WORD = split(/ /,$L);
	if ($norm) {
	    foreach my $w (@WORD) {
		$w=~s/^([^_]+)_([^_]+)$/$1/;
	    }
	}
	my %REF_NGRAM = ();
	my $length_translation_this_sentence = scalar(@WORD);
	my ($closest_diff,$closest_length) = (9999,9999);
	foreach my $reference (@{$REF[$s]}) {
#      print "$s $_ <=> $reference\n";
	    my @WORD = split(/ /,$reference);
	    my $length = scalar(@WORD);
	    my $diff = abs($length_translation_this_sentence-$length);
	    if ($diff < $closest_diff) {
		$closest_diff = $diff;
		$closest_length = $length;
		# print STDERR "$s: closest diff ".abs($length_translation_this_sentence-$length)." = abs($length_translation_this_sentence-$length), setting len: $closest_length\n";
	    } elsif ($diff == $closest_diff) {
		$closest_length = $length if $length < $closest_length;
		# from two references with the same closeness to me
		# take the *shorter* into account, not the "first" one.
	    }
	    for(my $n=1;$n<=4;$n++) {
		my %REF_NGRAM_N = ();
		for(my $start=0;$start<=$#WORD-($n-1);$start++) {
		    my $ngram = "$n";
		    for(my $w=0;$w<$n;$w++) {
			$ngram .= " ".$WORD[$start+$w];
		    }
		    $REF_NGRAM_N{$ngram}++;
		}
		foreach my $ngram (keys %REF_NGRAM_N) {
		    if (!defined($REF_NGRAM{$ngram}) || 
			$REF_NGRAM{$ngram} < $REF_NGRAM_N{$ngram}) {
			$REF_NGRAM{$ngram} = $REF_NGRAM_N{$ngram};
#	    print "$i: REF_NGRAM{$ngram} = $REF_NGRAM{$ngram}<BR>\n";
		    }
		}
	    }
	}
	$length_translation += $length_translation_this_sentence;
	$length_reference += $closest_length;
	for(my $n=1;$n<=4;$n++) {
	    my %T_NGRAM = ();
	    for(my $start=0;$start<=$#WORD-($n-1);$start++) {
		my $ngram = "$n";
		for(my $w=0;$w<$n;$w++) {
		    $ngram .= " ".$WORD[$start+$w];
		}
		$T_NGRAM{$ngram}++;
	    }
	    foreach my $ngram (keys %T_NGRAM) {
		$ngram =~ /^(\d+) /;
		my $n = $1;
		# my $corr = 0;
#	print "$i e $ngram $T_NGRAM{$ngram}<BR>\n";
		$TOTAL[$n] += $T_NGRAM{$ngram};
		if (defined($REF_NGRAM{$ngram})) {
		    if ($REF_NGRAM{$ngram} >= $T_NGRAM{$ngram}) {
			$CORRECT[$n] += $T_NGRAM{$ngram};
			# $corr =  $T_NGRAM{$ngram};
#	    print "$i e correct1 $T_NGRAM{$ngram}<BR>\n";
		    }
		    else {
			$CORRECT[$n] += $REF_NGRAM{$ngram};
			# $corr =  $REF_NGRAM{$ngram};
#	    print "$i e correct2 $REF_NGRAM{$ngram}<BR>\n";
		    }
		}
		# $REF_NGRAM{$ngram} = 0 if !defined $REF_NGRAM{$ngram};
		# print STDERR "$ngram: {$s, $REF_NGRAM{$ngram}, $T_NGRAM{$ngram}, $corr}\n"
	    }
	}
	$s++;
	$reals++;
    }

    my $brevity_penalty = 1;
    my $bleu = 0;
    
    my @bleu=();
    
    for(my $n=1;$n<=4;$n++) {
	if (defined ($TOTAL[$n])){
	    $bleu[$n]=($TOTAL[$n])?$CORRECT[$n]/$TOTAL[$n]:0;
	    # print STDERR "CORRECT[$n]:$CORRECT[$n] TOTAL[$n]:$TOTAL[$n]\n";
	}else{
	    $bleu[$n]=0;
	}
    }
    
    if ($length_reference==0){
	printf "BLEU = 0, 0/0/0/0 (BP=0, ratio=0, hyp_len=0, ref_len=0)\n";
	exit(1);
    }

    if ($length_translation<$length_reference) {
	$brevity_penalty = exp(1-$length_reference/$length_translation);
    }
    $bleu = $brevity_penalty * exp((my_log( $bleu[1] ) +
				    my_log( $bleu[2] ) +
				    my_log( $bleu[3] ) +
				    my_log( $bleu[4] ) ) / 4) ;
    return sprintf "BLEU = %.2f, %.1f/%.1f/%.1f/%.1f (BP=%.3f, ratio=%.3f, hyp_len=%d, ref_len=%d)\n",
    100*$bleu,
    100*$bleu[1],
    100*$bleu[2],
    100*$bleu[3],
    100*$bleu[4],
    $brevity_penalty,
    $length_translation / $length_reference,
    $length_translation,
    $length_reference;
}

sub my_log {
  return -9999999999 unless $_[0];
  return log($_[0]);
}
