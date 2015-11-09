//
//  BackgroundServiceHelper.m
//  PainReport
//
//  Created by HEAL ASU on 3/9/15.
//  Copyright (c) 2015 cnmc. All rights reserved.
//

#import "BackgroundServiceHelper.h"

@implementation BackgroundServiceHelper
- (void) start{
    self.responseData = [NSMutableData data];
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    NSString *serverSettings=[defaults objectForKey:@"serverAddress"];
    serverSettings=[serverSettings stringByAppendingString:@"/check_surveys?userPIN="];
    NSString *PIN=[defaults objectForKey:@"PIN"];
    serverSettings=[serverSettings stringByAppendingString:PIN];
    NSURLRequest *request = [NSURLRequest requestWithURL:
                             [NSURL URLWithString:serverSettings]];
    [[NSURLConnection alloc] initWithRequest:request delegate:self];
}

- (void)connection:(NSURLConnection *)connection didReceiveResponse:(NSURLResponse *)response {
    NSLog(@"didReceiveResponse");
    [self.responseData setLength:0];
}

- (void)connection:(NSURLConnection *)connection didReceiveData:(NSData *)data {
    [self.responseData appendData:data];
}

- (void)connection:(NSURLConnection *)connection didFailWithError:(NSError *)error {
    NSLog(@"didFailWithError");
    NSLog([NSString stringWithFormat:@"Connection failed: %@", [error description]]);
}

- (void)connectionDidFinishLoading:(NSURLConnection *)connection {
    NSLog(@"connectionDidFinishLoading");
    NSLog(@"Succeeded! Received %lu bytes of data",(unsigned long)[self.responseData length]);
    
    
  
    NSError *myError = nil;
    NSDictionary *res = [NSJSONSerialization JSONObjectWithData:self.responseData options:NSJSONReadingMutableLeaves error:&myError];
    
    
    NSArray *surveys = [res objectForKey:@"surveys"];
    NSMutableDictionary *dictOfSurveys;
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    if ([defaults objectForKey:@"dictOfSurveys"]==nil) {
        dictOfSurveys=[[NSMutableDictionary alloc] init];
    }
    else{
        dictOfSurveys=[[defaults objectForKey:@"dictOfSurveys"] mutableCopy];
    }
    
    for(NSDictionary *survey in surveys){
        NSMutableDictionary *nextSurvey=[survey mutableCopy];
        if ([dictOfSurveys objectForKey:[NSString stringWithFormat:@"%@",[nextSurvey objectForKey:@"surveyInstanceID"]]]==nil) {
            NSString *nextDueAtString=[nextSurvey objectForKey:@"nextDueAt"];
            NSDate   *nextDueDate=[self convertStringToDate:nextDueAtString];
            [nextSurvey setValue:nextDueDate forKey:@"dueDate"];
            [nextSurvey setValue:@NO forKey:@"notificationAlreadyIssued"];
            [dictOfSurveys setObject:nextSurvey forKey:[NSString stringWithFormat:@"%@",[nextSurvey objectForKey:@"surveyInstanceID"]]];
        }
    }
    [defaults setObject:dictOfSurveys forKey:@"dictOfSurveys"];
    [defaults synchronize];
    [self issueNotification];
}
-(NSDate*)convertStringToDate:(NSString *)dateString{
    NSDateFormatter *formatter = [[NSDateFormatter alloc] init];
    [formatter setDateFormat:@"yyyy-MM-dd'T'HH:mm:ss.SSSZ"];
    NSDate *returnDate=[formatter dateFromString:dateString];
    
    //trunacate time from NSdate
    [formatter setDateFormat:@"yyyy-MM-dd"];
    dateString=[formatter stringFromDate:returnDate];
    returnDate=[formatter dateFromString:dateString];
    return returnDate;
}

-(void)issueNotification{
    NSDictionary *answer;
    NSDate *todayDate=[NSDate date];
    NSDateFormatter *formatter = [[NSDateFormatter alloc] init];
    [formatter setDateFormat:@"yyyy-MM-dd"];
    NSString *dateString=[formatter stringFromDate:todayDate];
    todayDate=[formatter dateFromString:dateString];
    
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    NSMutableDictionary *dictOfSurveys=[[defaults objectForKey:@"dictOfSurveys"] mutableCopy];
    NSArray* sortedKeys = [dictOfSurveys allKeys];
    
    sortedKeys = [sortedKeys sortedArrayUsingSelector:@selector(localizedCaseInsensitiveCompare:)];
    for (NSString *key in sortedKeys) {
        NSDictionary *value=[dictOfSurveys objectForKey:key];
        if ([todayDate compare:[value objectForKey:@"dueDate"]]==NSOrderedSame && ![[value objectForKey:@"notificationAlreadyIssued"] boolValue]) {
            answer=value;
            [dictOfSurveys removeObjectForKey:key];
            break;
        }
    }
    [defaults setObject:dictOfSurveys forKey:@"dictOfSurveys"];
    [defaults synchronize];
    if(answer!=nil){
        UILocalNotification* localNotification = [[UILocalNotification alloc] init];
        localNotification.fireDate = [NSDate dateWithTimeIntervalSinceNow:1];
        NSString *alertBody=[@"You have a" stringByAppendingString:[NSString stringWithFormat:@"%@",[answer objectForKey:@"surveyTitle"]]];
        localNotification.alertBody = alertBody;
        localNotification.timeZone = [NSTimeZone defaultTimeZone];
        localNotification.applicationIconBadgeNumber = [[UIApplication sharedApplication] applicationIconBadgeNumber] + 1;
        [[UIApplication sharedApplication] scheduleLocalNotification:localNotification];
    }
}
@end
