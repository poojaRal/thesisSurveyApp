//
//  ViewController.m
//  PainReport
//
//  Created by HEAL ASU on 3/5/15.
//  Copyright (c) 2015 cnmc. All rights reserved.
//

#import "ViewController.h"
//#import "jsHandler.h"

@interface ViewController ()
@property (weak, nonatomic) IBOutlet UIWebView *webView;

@end

@implementation ViewController


- (void)viewDidLoad {
    [super viewDidLoad];
    //append 'painreport' at the end of useragent and set it
    NSString* userAgent = [_webView stringByEvaluatingJavaScriptFromString:@"navigator.userAgent"];
    NSString* customUserAgent=[userAgent stringByAppendingString:@"painreport"];
    NSDictionary *dictionary = [NSDictionary dictionaryWithObjectsAndKeys:customUserAgent, @"UserAgent", nil];
    [[NSUserDefaults standardUserDefaults] registerDefaults:dictionary];
    
    //load index.html
    NSString *path = [[NSBundle mainBundle] pathForResource:@"index" ofType:@"html" inDirectory:@"www"];
    NSURL *url = [NSURL fileURLWithPath:path];
    NSURLRequest *req = [NSURLRequest requestWithURL:url];
    [self createWebView];
    [_webView loadRequest:req];
    _webView.scrollView.bounces=NO;
    _webView.delegate=self;
    
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(checkToInvalidate)
     
                                                 name:UIApplicationWillEnterForegroundNotification object:nil];
    
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(appEnteredBackground)
     
                                                 name:UIApplicationDidEnterBackgroundNotification object:nil];
}

-(void)checkToInvalidate{
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    NSDate *invalidateTime=[defaults objectForKey:@"invalidateTime"];
    if([invalidateTime compare:[NSDate date]]==NSOrderedAscending){
        [_webView stringByEvaluatingJavaScriptFromString:@"invalidateSurvey()"];
        NSString *path = [[NSBundle mainBundle] pathForResource:@"index" ofType:@"html" inDirectory:@"www"];
        NSURL *url = [NSURL fileURLWithPath:path];
        NSURLRequest *req = [NSURLRequest requestWithURL:url];
        [_webView loadRequest:req];
    }
}
-(void)appEnteredBackground{
    NSUserDefaults *defaults=[NSUserDefaults standardUserDefaults];
    int stateSaveTime=[[defaults objectForKey:@"stateTime"] intValue];
    NSString *surveyInProgress=[_webView stringByEvaluatingJavaScriptFromString:@"checkIfSurveyInprogress()"];//surveyInProgress=-1 means survey is c ompleted or not begun
    
    if([[UIApplication sharedApplication] applicationState] == UIApplicationStateBackground && ![surveyInProgress isEqualToString:@"-1"]){
        UILocalNotification* firstStrike = [[UILocalNotification alloc] init];
        firstStrike.fireDate = [NSDate dateWithTimeIntervalSinceNow:1*60*60];
        NSString *alertBody=@"It is important that this survey is is finsihed, please return or it will be invalidated";
        firstStrike.alertBody = alertBody;
        firstStrike.timeZone = [NSTimeZone defaultTimeZone];
        firstStrike.repeatInterval=kCFCalendarUnitHour;
        firstStrike.applicationIconBadgeNumber = [[UIApplication sharedApplication] applicationIconBadgeNumber] + 1;
        [[UIApplication sharedApplication] scheduleLocalNotification:firstStrike];
        
        NSDate *invalidateTime=[NSDate dateWithTimeIntervalSinceNow:stateSaveTime*60*60];
        UILocalNotification* secondStrike = [[UILocalNotification alloc] init];
        secondStrike.fireDate =invalidateTime;
        alertBody=@"The Survey was invalidated, please retake the Survey";
        secondStrike.alertBody = alertBody;
        secondStrike.timeZone = [NSTimeZone defaultTimeZone];
        [[UIApplication sharedApplication] scheduleLocalNotification:secondStrike];
        
        [defaults setObject:invalidateTime forKey:@"invalidateTime"];
        [defaults synchronize];
    }

}

-(void)createWebView
{
    float width = self.view.bounds.size.width;
    float height = self.view.bounds.size.height;
    UIWebView *wv = [[UIWebView alloc] initWithFrame:CGRectMake(0, 20, width, height)];
    _webView=wv;
    _webView.autoresizingMask = (UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight);
    _webView.scalesPageToFit = YES;
    _webView.delegate = self;
    [self.view addSubview:_webView];
}
//gets the query strings from a url and saves them in NSUserdefaults
//used to parse custom urls
-(void)saveQueryStrings:(NSURL*)url{
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    for (NSString *qs in [url.query componentsSeparatedByString:@"&"]) {
        // Get the parameter name
        NSString *key = [[qs componentsSeparatedByString:@"="] objectAtIndex:0];
        // Get the parameter value
        NSString *value = [[qs componentsSeparatedByString:@"="] objectAtIndex:1];
        value = [value stringByReplacingOccurrencesOfString:@"+" withString:@" "];
        value = [value stringByReplacingPercentEscapesUsingEncoding:NSUTF8StringEncoding];
        
        [defaults setObject:value forKey:key];
    }
}

//to intercept custom urls-- to handle js based events
- (BOOL)webView:(UIWebView*)webView shouldStartLoadWithRequest:(NSURLRequest*)request navigationType:(UIWebViewNavigationType)navigationType {
    NSURL *URL = [request URL];
    if ([[URL scheme] isEqualToString:@"jshandler"]) {
        NSString *host=[URL host];
        if ([host isEqualToString:@"updateSettings"]) {
            [self saveQueryStrings:URL];
        }
        if ([host isEqualToString:@"submitError"]) {
            [self saveQueryStrings:URL];
            UIAlertView *alert = [[UIAlertView alloc] initWithTitle:@"Sorry"
                                                            message:@"Your survey was not submitted. We will try to submit it on your behalf"
                                                           delegate:nil
                                                  cancelButtonTitle:@"OK"
                                                  otherButtonTitles:nil];
            [alert show];
            
        }
        
    }
    return YES;
}

- (void)webViewDidFinishLoad:(UIWebView*) webView {
    //NSArray *settings={@"getPIN",@"getServerSettings",@"getSurveyInstanceId"};
    NSString *PIN = [webView stringByEvaluatingJavaScriptFromString:@"getPIN()"];
    NSString *serverSettings=[webView stringByEvaluatingJavaScriptFromString:@"getServerSettings()"];
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    if (PIN!=nil) {
        [defaults setObject:PIN forKey:@"pin"];
    }
    if (serverSettings!=nil) {
        [defaults setObject:serverSettings forKey:@"serverSettings"];
    }
    
    if([defaults boolForKey:@"invalidated"]){
        [webView stringByEvaluatingJavaScriptFromString:@"invalidateSurvey()"];
        [defaults setBool:NO forKey:@"invalidated"];
    }
    [defaults synchronize];
}

- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

@end
