//
//  AppDelegate.h
//  PainReport
//
//  Created by HEAL ASU on 3/5/15.
//  Copyright (c) 2015 cnmc. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "BackgroundServiceHelper.h"
#import "ViewController.h"
#define NOTIFLOWERBOUND (18)
#define NOTIFUPPERBOUND (21)

@interface AppDelegate : UIResponder <UIApplicationDelegate>
@property NSMutableData *responseData;
@property (weak, nonatomic) UIViewController *myViewController;
@property (strong, nonatomic) UIWindow *window;

@end

