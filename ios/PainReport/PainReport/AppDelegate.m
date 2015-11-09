//
//  AppDelegate.m
//  iOSpainReport
//
//  Created by aadibhat on 1/29/15.
//  Copyright (c) 2015 Anirudha Adibhatla. All rights reserved.
//

#import "AppDelegate.h"

@implementation AppDelegate
/*
 *  System Versioning Preprocessor Macros
 */

#define SYSTEM_VERSION_EQUAL_TO(v)                  ([[[UIDevice currentDevice] systemVersion] compare:v options:NSNumericSearch] == NSOrderedSame)
#define SYSTEM_VERSION_GREATER_THAN(v)              ([[[UIDevice currentDevice] systemVersion] compare:v options:NSNumericSearch] == NSOrderedDescending)
#define SYSTEM_VERSION_GREATER_THAN_OR_EQUAL_TO(v)  ([[[UIDevice currentDevice] systemVersion] compare:v options:NSNumericSearch] != NSOrderedAscending)
#define SYSTEM_VERSION_LESS_THAN(v)                 ([[[UIDevice currentDevice] systemVersion] compare:v options:NSNumericSearch] == NSOrderedAscending)
#define SYSTEM_VERSION_LESS_THAN_OR_EQUAL_TO(v)     ([[[UIDevice currentDevice] systemVersion] compare:v options:NSNumericSearch] != NSOrderedDescending)

NSUserDefaults* defaults;

- (void)applicationWillResignActive:(UIApplication *)application
{
    // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
    // Use this method to pause ongoing tasks, disable timers, and throttle down OpenGL ES frame rates. Games should use this method to pause the game.
}

- (void)applicationDidEnterBackground:(UIApplication *)application
{
    // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
    // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
}

- (void)applicationWillEnterForeground:(UIApplication *)application
{
    // Called as part of the transition from the background to the inactive state; here you can undo many of the changes made on entering the background.
}

- (void)applicationDidBecomeActive:(UIApplication *)application
{
    // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    [[UIApplication sharedApplication] cancelAllLocalNotifications];
    application.applicationIconBadgeNumber = 0;
}

- (void)applicationWillTerminate:(UIApplication *)application
{
    // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
}
- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
    defaults=[NSUserDefaults standardUserDefaults];
    int intervalTime=[[defaults objectForKey:@"intervalTime"] intValue];
    [self registerForRemoteNotification];
    [[UIApplication sharedApplication] setMinimumBackgroundFetchInterval:intervalTime*60*60];
    
    // Handle launching from a notification
    UILocalNotification *locationNotification = [launchOptions objectForKey:UIApplicationLaunchOptionsLocalNotificationKey];
    if (locationNotification) {
        // Set icon badge number to zero
        application.applicationIconBadgeNumber = 0;
    }
    
    return YES;
}



-(void)application:(UIApplication *)application performFetchWithCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{

    defaults = [NSUserDefaults standardUserDefaults];
    NSString *PIN=[defaults objectForKey:@"pin"];
  
    
    //Download  the Content .
    
    self.responseData = [NSMutableData data];
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    NSString *serverSettings=[defaults objectForKey:@"serverAddress"];
    serverSettings=[serverSettings stringByAppendingString:@"/check_surveys?userPIN="];
    //NSString *PIN=[defaults objectForKey:@"PIN"];
    serverSettings=[serverSettings stringByAppendingString:PIN];
    //NSURLRequest *request = [NSURLRequest requestWithURL:
                            // [NSURL URLWithString:serverSettings]];
    //[[NSURLConnection alloc] initWithRequest:request delegate:self];
    NSURLSession *session = [NSURLSession sharedSession];
    [[session dataTaskWithURL:[NSURL URLWithString:serverSettings]
            completionHandler:^(NSData *data,
                                NSURLResponse *response,
                                NSError *error) {

                // handle basic connectivity issues here
                
                if (error) {
                    return;
                }
                
                // handle HTTP errors here
                
                if ([response isKindOfClass:[NSHTTPURLResponse class]]) {
                    
                    NSInteger statusCode = [(NSHTTPURLResponse *)response statusCode];
                    
                    if (statusCode != 200) {
                        
                        return;
                    }
                }
                
                NSError *myError = nil;
                NSDictionary *res = [NSJSONSerialization JSONObjectWithData:data options:NSJSONReadingMutableLeaves error:&myError];
                
                
                NSArray *surveys = [res objectForKey:@"surveys"];
             
                NSDictionary *nextSurvey=surveys[0];
                //NSDate *nextDueDate=[self convertStringToDate:[nextSurvey objectForKey:@"nextDueAt"]];
                
                BOOL okayToStart=[nextSurvey objectForKey:@"okayToStart"];
                if (okayToStart && [self compareWithCurrentTime:NOTIFLOWERBOUND]==NSOrderedAscending && [self compareWithCurrentTime:NOTIFUPPERBOUND]==NSOrderedDescending) {
                    UILocalNotification* localNotification = [[UILocalNotification alloc] init];
                    localNotification.fireDate = [NSDate dateWithTimeIntervalSinceNow:1];
                    NSString *alertBody=[@"You have a" stringByAppendingString:[NSString stringWithFormat:@"%@",[nextSurvey objectForKey:@"surveyTitle"]]];
                    localNotification.alertBody = alertBody;
                    localNotification.timeZone = [NSTimeZone defaultTimeZone];
                    localNotification.applicationIconBadgeNumber = [[UIApplication sharedApplication] applicationIconBadgeNumber] + 1;
                    [[UIApplication sharedApplication] scheduleLocalNotification:localNotification];
                }

                
            }] resume];
    if ([[NSUserDefaults standardUserDefaults] objectForKey:@"json"]!=nil) {
        NSString *post =[[NSUserDefaults standardUserDefaults] objectForKey:@"json"];
        NSData *postData = [post dataUsingEncoding:NSUTF8StringEncoding];
        NSString *postLength = [NSString stringWithFormat:@"%lu", (unsigned long)[postData length]];
        NSMutableURLRequest *request = [[NSMutableURLRequest alloc] init];
        [request setURL:[NSURL URLWithString:[[defaults objectForKey:@"serverAddress"] stringByAppendingString:@"/submit_survey"]]];
        [request setHTTPMethod:@"POST"];
        [request setValue:postLength forHTTPHeaderField:@"Content-Length"];
        [request setValue:@"application/json" forHTTPHeaderField:@"Content-Type"];
        [request setValue:@"application/json" forHTTPHeaderField:@"Accept"];
        [request setHTTPBody:postData];
        
        NSURLResponse *requestResponse;
        NSData *requestHandler = [NSURLConnection sendSynchronousRequest:request returningResponse:&requestResponse error:nil];
        
        NSString *requestReply = [[NSString alloc] initWithBytes:[requestHandler bytes] length:[requestHandler length] encoding:NSASCIIStringEncoding];
  
        
        NSError *jsonError;
        NSData *objectData = [requestReply dataUsingEncoding:NSUTF8StringEncoding];
        NSDictionary *json = [NSJSONSerialization JSONObjectWithData:objectData
                                                             options:NSJSONReadingMutableContainers
                                                               error:&jsonError];
        
        if ([[json objectForKey:@"message"] isEqualToString:@"Success"]) {
            UILocalNotification* localNotification = [[UILocalNotification alloc] init];
            localNotification.fireDate = [NSDate dateWithTimeIntervalSinceNow:1];
            NSString *alertBody=@"The Survey was submitted";
            localNotification.alertBody = alertBody;
            localNotification.timeZone = [NSTimeZone defaultTimeZone];
            
            [[UIApplication sharedApplication] scheduleLocalNotification:localNotification];
            
            [[NSUserDefaults standardUserDefaults] setObject:nil forKey:@"json"];

        }
    }
    //Cleanup
    completionHandler(UIBackgroundFetchResultNewData);
    
}

- (void)application:(UIApplication *)application didReceiveLocalNotification:(UILocalNotification *)notification
{
    UIApplicationState state = [application applicationState];
    if (state == UIApplicationStateActive) {
        UIAlertView *alert = [[UIAlertView alloc] initWithTitle:@"Reminder"
                                                        message:notification.alertBody
                                                       delegate:self cancelButtonTitle:@"OK"
                                              otherButtonTitles:nil];
        [alert show];
    }
    
    // Request to reload table view data
    [[NSNotificationCenter defaultCenter] postNotificationName:@"reloadData" object:self];
    
    // Set icon badge number to zero
    application.applicationIconBadgeNumber = 0;
}

- (void)registerForRemoteNotification {
    if (SYSTEM_VERSION_GREATER_THAN_OR_EQUAL_TO(@"8.0")) {
        UIUserNotificationType types = UIUserNotificationTypeSound | UIUserNotificationTypeBadge | UIUserNotificationTypeAlert;
        UIUserNotificationSettings *notificationSettings = [UIUserNotificationSettings settingsForTypes:types categories:nil];
        [[UIApplication sharedApplication] registerUserNotificationSettings:notificationSettings];
    } else {
        [[UIApplication sharedApplication] registerForRemoteNotificationTypes:(UIRemoteNotificationTypeBadge | UIRemoteNotificationTypeSound | UIRemoteNotificationTypeAlert)];
    }
}

#ifdef __IPHONE_8_0
- (void)application:(UIApplication *)application didRegisterUserNotificationSettings:(UIUserNotificationSettings *)notificationSettings {
    [application registerForRemoteNotifications];
}
#endif

//Helper functions
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


-(NSComparisonResult)compareWithCurrentTime:(int)inputTime{
    NSDate *now=[NSDate date];
    
    NSCalendar *calendar = [[NSCalendar alloc] initWithCalendarIdentifier:NSGregorianCalendar];
    NSDateComponents *components = [calendar components:NSCalendarUnitYear|NSCalendarUnitMonth|NSCalendarUnitDay fromDate:now];
    [components setHour:inputTime];
    NSDate *todayInpTime = [calendar dateFromComponents:components];
    
    NSComparisonResult result = [todayInpTime compare:now];
    return result;
}

@end
