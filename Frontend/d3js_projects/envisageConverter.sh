#!/bin/bash

filename='combined.json';
filename2='combinedTemp.json';
filename3='combinedEvents.json';

echo -ne 'Combining data...\r'

find . -type f -name *.envisageData -exec cat {} > combinedTemp.txt \;
#find . -type f -name 2017-01-17.envisageData -exec cat {} > combinedTemp.txt \;

#set input to json format, then sort lines in file alphabetically
#since user_id is always at the start of the string,
#We will be separating the data into unique playthroughs preserving the original time sequence

sed 's/}{/\'$'\n/g' combinedTemp.txt > combinedData.txt;
sed 's/"$/"}/g' combinedData.txt > combinedTemp.txt;
sed 's/^"/{"/g' combinedTemp.txt | sort -k 1 -n > combined.json;

user1='FIRST';
user2='FIRST';
event1='FIRST';
event2='FIRST';
output='';
eventoutput='';
finaloutput='';

#remove events we don't want to process
total=$(wc -l < "$filename")
i=0;
while IFS= read -r line
do
    #compare with previous line
	user2=$(echo "$line" | sed -e 's/^.*"user_id"[ ]*:[ ]*"//' -e 's/".*//');
	event2=$(echo "$line" | sed -e 's/^.*"event"[ ]*:[ ]*"//' -e 's/".*//');
	locale=$(echo "$line" | sed -e 's/^.*"locale"[ ]*:[ ]*"//' -e 's/".*//');
	timestamp=$(echo "$line" | sed 's/^.*"server_ts": //;s/,.*$//');
	
	interval=86400; #86400 ticks in a day, we round the timestamp up to show each day
	
	timestamp=$(echo $((timestamp / interval)));
	
	timestamp=$(echo $((timestamp * interval)));
	
	if [ "$user1" == "$user2" ]; then 
		#we're choosing to ignore transitions from an event to the same event (refresh events)
		if [ "$event1" != "$event2" ]; then 
			#this event leads from the previous event
			output=$(echo "$output"$'\n'"{\"source\": \"$event1\", \"target\": \"$event2\", \"timestamp\": \"$timestamp\", \"locale\": \"$locale\"}");
			#generate a list of events (with repeated entries, for now)
			eventoutput=$(echo "$eventoutput"$'\n'"{\"id\": \"$event1\"}");
		fi
	fi
	
	user1="$user2";
	event1="$event2";
	
	let "i++"
	#echo -ne 'Removing unwanted events:'$i' of'$total'     \r'
done <"$filename"

#remove starting/trailing newlines and save to file
echo "$output" | sed -e :a -e '/./,$!d;/^\n*$/{$d;N;};/\n$/ba'  > $filename2;

total=$(wc -l < "$filename2")
i=0;
while IFS= read -r line
do	
	linepart=$(echo "${line%?}");
	value=$(echo $(grep -c "$linepart" "$filename2"));
	#count how often the source/target links are ocurring ;
	finaloutput=$(echo "$finaloutput"$'\n'"${linepart%?}\", \"value\": \"$value\"}");
	let "i++"
	echo -ne 'Removing duplicate lines:'$i' of'$total'      \r'
done <"$filename2"

#remove duplicate lines and save to finaloutput variable
finaloutput=$(echo "$finaloutput" | sed -e :a -e '/./,$!d;/^\n*$/{$d;N;};/\n$/ba' | sed -e :a -e '/./,$!d;/^\n*$/{$d;N;};/\n$/ba' | sort | uniq);


echo -ne 'Compiling final file:                  \r'

#create non-repeating list of events (removing duplicates)
eventoutput=$(echo "$eventoutput" | sed -e :a -e '/./,$!d;/^\n*$/{$d;N;};/\n$/ba' | sort | uniq);
#add 'finishing touches' to make correct json: commas after each }, except for the last entry
eventoutput=$(echo "$eventoutput" | sed 's/}/},/g' | sed  '
    $x;$G;/\(.*\),/!H;//!{$!d
};  $!x;$s//\1/;s/^\n//');

#add 'finishing touches' to make correct json: commas after each }, except for the last entry
finaloutput=$(echo "$finaloutput" | sed 's/}/},/g');
finaloutput=$(echo "$finaloutput" | sed  '
    $x;$G;/\(.*\),/!H;//!{$!d
};  $!x;$s//\1/;s/^\n//');

#combine all data into a second file combining all data in a complete JSON format
realfinaloutput="{\"nodes\" :[$eventoutput], \"links\": [$finaloutput]}";

echo "$realfinaloutput" > $filename3;

echo -ne 'Processing complete. Have a nice day!        \r'